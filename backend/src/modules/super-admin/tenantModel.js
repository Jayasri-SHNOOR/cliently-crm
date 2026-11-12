const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    admin: { type: String, required: true, trim: true, maxlength: 150 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^$|^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    plan: {
      type: String,
      required: true,
      enum: ["Starter", "Pro", "Enterprise"],
    },
    environment: { type: String, required: true, trim: true, maxlength: 50 },
    status: {
      type: String,
      required: true,
      enum: ["Active", "Pending", "Blocked"],
      default: "Pending",
    },
    date: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminTenant ||
  mongoose.model("SuperAdminTenant", tenantSchema, "superadmin_tenants");