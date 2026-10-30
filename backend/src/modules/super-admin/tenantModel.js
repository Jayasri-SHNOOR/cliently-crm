const mongoose = require("mongoose");

const tenantSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    admin: { type: String, required: true, trim: true, maxlength: 150 },
    plan: { type: String, required: true, enum: ["Starter", "Pro", "Enterprise"] },
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
tenantSchema.index({ createdAt: -1, _id: -1 });

module.exports =
  mongoose.models.SuperAdminTenant ||
  mongoose.model("SuperAdminTenant", tenantSchema, "superadmin_tenants");
