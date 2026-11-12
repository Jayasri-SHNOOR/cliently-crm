const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: "platform",
    },

    organization: {
      companyName: { type: String, default: "Cliently" },
      supportEmail: { type: String, default: "" },
      supportUrl: { type: String, default: "" },
    },

    regional: {
      timezone: { type: String, default: "Asia/Kolkata" },
      language: { type: String, default: "en" },
      dateFormat: { type: String, default: "DD/MM/YYYY" },
      timeFormat: { type: String, default: "24h" },
      currency: { type: String, default: "INR" },
      weekStartsOn: { type: String, default: "Monday" },
    },

    notifications: {
      emailEnabled: { type: Boolean, default: true },
      systemAlertsEnabled: { type: Boolean, default: true },
      securityAlerts: { type: Boolean, default: true },
      billingAlerts: { type: Boolean, default: true },
    },

    businessHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "09:00" },
      endTime: { type: String, default: "18:00" },
      workingDays: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    },

    security: {
      twoFactorRequired: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 30 },
      passwordMinLength: { type: Number, default: 8 },
      requireUppercase: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      requireSpecialCharacter: { type: Boolean, default: false },
    },

    dataSharing: {
      allowDataExport: { type: Boolean, default: true },
      allowExternalSharing: { type: Boolean, default: false },
    },

    customization: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    integrations: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

module.exports = mongoose.model("PlatformSettings", settingsSchema);