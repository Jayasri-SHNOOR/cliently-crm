const razorpay = require("../../../config/razorpay");
const Payment = require("../models/Payment");
const Sale = require("../models/sale");
const crypto = require("crypto");
const mongoose = require("mongoose");

// Create a Razorpay order for an existing sale
const createRazorpayOrder = async (req, res) => {
  try {
    const { saleId } = req.body;

    if (!saleId) {
      return res.status(400).json({
        message: "Sale ID is required",
      });
    }

    if (!mongoose.isValidObjectId(saleId)) {
      return res.status(400).json({
        message: "Invalid sale ID",
      });
    }

    // only sales of the logged-in user's company can be paid
    const sale = await Sale.findOne({
      _id: saleId,
      tenantId: req.user.tenantId,
    });

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    const paymentStatus = String(sale.paymentStatus || "").toLowerCase();

    if (["paid", "success", "completed"].includes(paymentStatus)) {
      return res.status(400).json({
        message: "This sale has already been paid",
      });
    }

    const amountInRupees = Number(sale.totalAmount);

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return res.status(400).json({
        message: "Invalid sale amount",
      });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `sale_${String(sale._id).slice(-20)}_${Date.now()}`,
      notes: {
        saleId: String(sale._id),
        customerId: String(sale.customerId),
      },
    });

    await Payment.create({
      tenantId: sale.tenantId,
      customerId: String(sale.customerId),
      saleId: String(sale._id),
      orderId: order.id,
      amount: amountInRupees,
      currency: "INR",
      status: "Pending",
    });

    return res.status(201).json({
      message: "Payment order created successfully",
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      saleId: String(sale._id),
    });
  } catch (error) {
    console.error("Create Razorpay order error:", error);

    return res.status(500).json({
      message: "Unable to create payment order",
    });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message: "Payment verification details are required",
      });
    }

    // Find the pending payment
    const payment = await Payment.findOne({
      orderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment order not found",
      });
    }

    // Verify the Razorpay signature on the backend
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const isAuthentic =
      /^[a-f0-9]{64}$/i.test(razorpay_signature) &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "hex"),
        Buffer.from(razorpay_signature, "hex")
      );

    if (!isAuthentic) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    // Avoid processing the same payment twice
    if (payment.status === "Success") {
      if (payment.paymentId === razorpay_payment_id) {
        return res.status(200).json({
          message: "Payment already verified",
          status: "Success",
        });
      }

      return res.status(409).json({
        message: "This order has already been processed",
      });
    }

    if (payment.status !== "Pending") {
      return res.status(400).json({
        message: "This payment cannot be verified",
      });
    }

    payment.paymentId = razorpay_payment_id;
    payment.status = "Success";
    await payment.save();

    // Update the associated sale
    await Sale.findByIdAndUpdate(payment.saleId, {
      paymentStatus: "Paid",
    });

    return res.status(200).json({
      message: "Payment verified successfully",
      status: "Success",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return res.status(500).json({
      message: "Unable to verify payment",
    });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};