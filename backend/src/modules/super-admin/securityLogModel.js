const mongoose = require("mongoose");

const securityLogSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, trim: true, maxlength: 500 },
    category: {
      type: String,
      enum: ["Authentication", "Authorization", "Data Access", "Configuration", "System", "General"],
      default: "General",
    },
    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },
    actor: { type: String, trim: true, maxlength: 150, default: "System" },
    details: { type: String, trim: true, maxlength: 2000, default: "" },
    occurredAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminSecurityLog ||
  mongoose.model("SuperAdminSecurityLog", securityLogSchema, "superadmin_security_logs");
