const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 100 },
    price: { type: Number, required: true, min: 0 },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },
    description: { type: String, trim: true, maxlength: 500, default: "" },
    features: { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminPlan ||
  mongoose.model("SuperAdminPlan", planSchema, "superadmin_plans");
