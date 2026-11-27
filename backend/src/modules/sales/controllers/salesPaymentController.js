const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Customer = require("../models/Customer");
const ServiceRequest = require("../../../models/ServiceRequest");

const LABELS = { Success: "Received", Pending: "Pending", Failed: "Failed" };

const listPayments = async (req, res) => {
  try {
    const { tenantId, id: userId } = req.user;

    const customers = await Customer.find({ tenantId, salesExecId: userId })
      .select("name customerCode")
      .lean();
    const ids = customers.map((c) => c._id);
    const idStrings = ids.map(String);
    const byId = Object.fromEntries(customers.map((c) => [String(c._id), c]));

    const [payments, unpaid] = await Promise.all([
      ids.length
        ? Payment.find({ tenantId, $or: [{ customerRef: { $in: ids } }, { customerId: { $in: idStrings } }] })
            .sort({ createdAt: -1 })
            .limit(300)
            .lean()
        : [],
      ServiceRequest.find({
        tenantId,
        salesExecId: userId,
        charge: { $gt: 0 },
        paymentStatus: "Unpaid",
        status: { $ne: "Cancelled" },
      })
        .sort({ createdAt: 1 })
        .lean(),
    ]);

    const customerFor = (payment) => {
      const key = String(payment.customerRef || payment.customerId || "");
      return mongoose.isValidObjectId(key) ? byId[key] : null;
    };

    const rows = payments.map((p) => ({
      id: p._id,
      ref: p.paymentId || p.orderId,
      customer: customerFor(p)?.name || "—",
      purpose: p.serviceRequestId ? "Service charge" : "Sale",
      amount: p.amount,
      status: LABELS[p.status] || p.status,
      date: p.paidAt || p.createdAt,
      failureReason: p.failureReason || "",
    }));

    const outstanding = unpaid.map((r) => ({
      id: r._id,
      requestNumber: r.requestNumber,
      customer: byId[String(r.customerId)]?.name || "—",
      serviceType: r.serviceType,
      amount: r.charge,
      since: r.updatedAt || r.createdAt,
    }));

    const sum = (list, status) => list.filter((p) => p.status === status).reduce((s, p) => s + (p.amount || 0), 0);

    res.status(200).json({
      success: true,
      summary: {
        received: sum(rows, "Received"),
        receivedCount: rows.filter((p) => p.status === "Received").length,
        failedCount: rows.filter((p) => p.status === "Failed").length,
        outstanding: outstanding.reduce((s, r) => s + r.amount, 0),
        outstandingCount: outstanding.length,
      },
      payments: rows,
      outstanding,
    });
  } catch (error) {
    console.error("Sales payments error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch payments" });
  }
};

module.exports = { listPayments };
