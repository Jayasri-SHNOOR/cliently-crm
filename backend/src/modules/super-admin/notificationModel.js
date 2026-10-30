
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    type: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "System",
    },
    audience: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "All",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ createdAt: -1, _id: -1 });

module.exports =
  mongoose.models.SuperAdminNotification ||
  mongoose.model(
    "SuperAdminNotification",
    notificationSchema,
    "superadmin_notifications"
  );
