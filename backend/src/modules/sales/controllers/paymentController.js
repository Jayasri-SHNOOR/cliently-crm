const crypto = require("crypto");
const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Sale = require("../models/sale");

const PAID_STATUSES = ["paid", "success", "completed"];

function getRazorpay() {
  return require("../../../config/razorpay");
}

function signatureMatches(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) {
    return false;
  }
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
}

const createRazorpayOrder = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { saleId } = req.body;

    if (!tenantId) {
      return res.status(403).json({ message: "Tenant information is missing" });
    }

    if (!saleId || !mongoose.isValidObjectId(saleId)) {
      return res.status(400).json({ message: "A valid sale ID is required" });
    }

    const sale = await Sale.findOne({ _id: saleId, tenantId });

    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }

    if (PAID_STATUSES.includes(String(sale.paymentStatus || "").toLowerCase())) {
      return res.status(400).json({ message: "This sale has already been paid" });
    }

    const amountInRupees = Number(sale.totalAmount) - Number(sale.amountPaid || 0);

    if (!Number.isFinite(amountInRupees) || amountInRupees < 1) {
      return res.status(400).json({ message: "Invalid sale amount" });
    }

    const order = await getRazorpay().orders.create({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt: `sale_${String(sale._id).slice(-20)}_${Date.now()}`.slice(0, 40),
      notes: {
        tenantId: String(tenantId),
        saleId: String(sale._id),
        customerId: String(sale.customerId),
      },
    });

    await Payment.create({
      tenantId,
      customerId: String(sale.customerId),
      customerRef: sale.customerRef || null,
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
    console.error("Create Razorpay order error:", error.message);
    return res.status(500).json({ message: "Unable to create payment order" });
  }
};

const verifyRazorpayPayment = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!tenantId) {
      return res.status(403).json({ message: "Tenant information is missing" });
    }

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({ message: "Payment verification details are required" });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id, tenantId });

    if (!payment) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    if (!signatureMatches(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    if (payment.status === "Success") {
      if (payment.paymentId === razorpay_payment_id) {
        return res.status(200).json({ message: "Payment already verified", status: "Success" });
      }
      return res.status(409).json({ message: "This order has already been processed" });
    }

    if (payment.status !== "Pending") {
      return res.status(400).json({ message: "This payment cannot be verified" });
    }

    const paidAt = new Date();
    const updated = await Payment.findOneAndUpdate(
      { _id: payment._id, status: "Pending" },
      {
        $set: {
          paymentId: razorpay_payment_id,
          status: "Success",
          verifiedBy: "checkout",
          paidAt,
        },
      },
      { returnDocument: "after" }
    );

    if (!updated) {
      return res.status(409).json({ message: "This order has already been processed" });
    }

    await Sale.updateOne(
      { _id: payment.saleId, tenantId },
      {
        $set: { paymentStatus: "Paid", paidAt },
        $inc: { amountPaid: payment.amount },
      }
    );

    return res.status(200).json({
      message: "Payment verified successfully",
      status: "Success",
      paymentId: razorpay_payment_id,
    });
  } catch (error) {
    console.error("Payment verification error:", error.message);
    return res.status(500).json({ message: "Unable to verify payment" });
  }
};

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
};