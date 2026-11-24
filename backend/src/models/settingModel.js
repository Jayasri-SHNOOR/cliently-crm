
const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "platform",
      unique: true,
      required: true,
    },

    // Organization Settings
    organization: {
      companyName: {
        type: String,
        default: "Cliently",
        trim: true,
      },
      supportEmail: {
        type: String,
        default: "",
        trim: true,
      },
      supportUrl: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // Regional Settings
    regional: {
      timezone: {
        type: String,
        default: "Asia/Kolkata",
      },
      language: {
        type: String,
        default: "en",
      },
      locale: {
        type: String,
        default: "en-IN",
      },
      dateFormat: {
        type: String,
        default: "DD/MM/YYYY",
      },
      timeFormat: {
        type: String,
        default: "24h",
      },
      currency: {
        type: String,
        default: "INR",
      },
      weekStartsOn: {
        type: String,
        default: "Monday",
      },
    },

    // Notification Settings
    notifications: {
      emailEnabled: {
        type: Boolean,
        default: true,
      },
      systemAlertsEnabled: {
        type: Boolean,
        default: true,
      },
    },

    // Business Hours
    businessHours: {
      enabled: {
        type: Boolean,
        default: false,
      },
      startTime: {
        type: String,
        default: "09:00",
      },
      endTime: {
        type: String,
        default: "18:00",
      },
      workingDays: {
        type: [String],
        default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      },
    },

    // Security Settings
    security: {
      twoFactorRequired: {
        type: Boolean,
        default: false,
      },
      sessionTimeoutMinutes: {
        type: Number,
        default: 30,
      },
      passwordMinLength: {
        type: Number,
        default: 8,
      },
      requireUppercase: {
        type: Boolean,
        default: true,
      },
      requireNumber: {
        type: Boolean,
        default: true,
      },
      requireSpecialCharacter: {
        type: Boolean,
        default: false,
      },
    },

    // Data Sharing Settings
    dataSharing: {
      allowDataExport: {
        type: Boolean,
        default: true,
      },
      allowExternalSharing: {
        type: Boolean,
        default: false,
      },
    },

    // Customization Settings
    customization: {
      defaultPipeline: {
        type: String,
        default: "Standard",
      },
      defaultView: {
        type: String,
        default: "Dashboard",
      },
    },

    // Integration Settings
    integrations: {
      apiAccessEnabled: {
        type: Boolean,
        default: true,
      },
      webhooksEnabled: {
        type: Boolean,
        default: false,
      },
    },

    // User who last updated the settings
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const SuperAdminSettings =
  mongoose.models.SuperAdminSettings ||
  mongoose.model("SuperAdminSettings", settingSchema);

module.exports = SuperAdminSettings;
