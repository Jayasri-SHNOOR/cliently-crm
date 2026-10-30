const mongoose = require("mongoose");

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "platform", unique: true, immutable: true },

    organization: {
      companyName: { type: String, default: "Cliently", trim: true, maxlength: 100 },
      supportEmail: {
        type: String,
        default: "",
        trim: true,
        lowercase: true,
        match: [/^$|^\S+@\S+\.\S+$/, "Invalid email address"],
      },
    },

    regional: {
      timezone: { type: String, default: "Asia/Kolkata" },
      language: { type: String, default: "en" },
      locale: { type: String, default: "en-IN" },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY",
        enum: ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
      },
      timeFormat: { type: String, default: "24h", enum: ["12h", "24h"] },
      currency: { type: String, default: "INR", uppercase: true, match: /^[A-Z]{3}$/ },
      weekStartsOn: { type: String, default: "Monday", enum: DAYS },
    },

    notifications: {
      emailEnabled: { type: Boolean, default: true },
      systemAlertsEnabled: { type: Boolean, default: true },
    },

    businessHours: {
      enabled: { type: Boolean, default: false },
      startTime: { type: String, default: "09:00", match: [TIME_REGEX, "Time must be HH:mm"] },
      endTime: { type: String, default: "18:00", match: [TIME_REGEX, "Time must be HH:mm"] },
      workingDays: {
        type: [{ type: String, enum: DAYS }],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    },


    security: {
      twoFactorRequired: { type: Boolean, default: false },
      sessionTimeoutMinutes: { type: Number, default: 30, min: 5, max: 1440 },
      passwordMinLength: { type: Number, default: 8, min: 8, max: 128 },
      requireUppercase: { type: Boolean, default: true },
      requireNumber: { type: Boolean, default: true },
      requireSpecialCharacter: { type: Boolean, default: false },
    },

    dataSharing: {
      allowDataExport: { type: Boolean, default: true },
      allowExternalSharing: { type: Boolean, default: false },
    },

    customization: {
      defaultPipeline: { type: String, default: "Sales Pipeline" },
      defaultView: { type: String, default: "List", enum: ["List", "Kanban", "Calendar"] },
    },

    integrations: {
      apiAccessEnabled: { type: Boolean, default: false },
      webhooksEnabled: { type: Boolean, default: false },
    },


    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminSettings ||
  mongoose.model("SuperAdminSettings", settingsSchema);