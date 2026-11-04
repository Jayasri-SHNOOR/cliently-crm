const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
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
      default: "General",
    },

    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },

    publishedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Sort announcements by newest first
announcementSchema.index({ createdAt: -1, _id: -1 });

module.exports =
  mongoose.models.SuperAdminAnnouncement ||
  mongoose.model(
    "SuperAdminAnnouncement",
    announcementSchema,
    "superadmin_announcements"
  );