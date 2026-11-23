const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      index: true,
    },
    customerId: {
      type: String,
      required: true,
    },
    employeeId: {
      type: String,
      default: "",
    },
    saleDate: {
      type: String,
      default: "",
    },
    totalAmount: {
      type: Number,
      default: 0,
    },
    saleStatus: {
      type: String,
      default: "",
    },
    paymentStatus: {
      type: String,
      default: "",
    },
    items: {
      type: Array,
      default: [],
    },
  },
  {
    collection: "sales",
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.models.Sale || mongoose.model("Sale", saleSchema);