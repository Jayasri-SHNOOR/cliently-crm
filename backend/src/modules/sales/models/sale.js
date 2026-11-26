
const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
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
  }
);

module.exports = mongoose.model("Sale", saleSchema);
