const mongoose = require("mongoose");

const integrationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    enabled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminIntegration ||
  mongoose.model("SuperAdminIntegration", integrationSchema, "superadmin_integrations");
