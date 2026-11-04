
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
      trim: true,
    },
    company: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    city: {
      type: String,
      default: "",
      trim: true,
    },
    customerType: {
      type: String,
      default: "regular",
    },
    registrationDate: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Prospect"],
      default: "Active",
    },
  },
  {
    timestamps: true,
    strict: false,
    collection: "customers",
  }
);

module.exports = mongoose.model("Customer", customerSchema);

