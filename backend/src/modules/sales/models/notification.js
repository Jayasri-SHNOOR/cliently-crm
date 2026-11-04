
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Notification title is required"],
      trim: true,
    },

    message: {
      type: String,
      required: [true, "Notification message is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["Task", "Meeting", "Customer", "Product", "System"],
      default: "System",
    },

    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

module.exports = mongoose.model("Notification", notificationSchema);
