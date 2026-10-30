const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    company: { type: String, required: true, trim: true, maxlength: 150 },
    plan: { type: String, required: true, trim: true, maxlength: 100 },
    status: {
      type: String,
      enum: ["Active", "Trial", "Past Due", "Cancelled"],
      default: "Active",
    },
    billingCycle: {
      type: String,
      enum: ["Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },
    amount: { type: Number, required: true, min: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);
subscriptionSchema.index({ createdAt: -1, _id: -1 });
module.exports =
  mongoose.models.SuperAdminSubscription ||
  mongoose.model("SuperAdminSubscription", subscriptionSchema, "superadmin_subscriptions");
