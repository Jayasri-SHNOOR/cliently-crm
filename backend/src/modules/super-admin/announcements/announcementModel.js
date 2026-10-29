const mongoose = require("mongoose");

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    type: {
      type: String,
      enum: ["General", "Billing", "Security", "Feature"],
      default: "General",
    },
    status: {
      type: String,
      enum: ["Draft", "Published"],
      default: "Draft",
    },
    publishedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SuperAdminAnnouncement ||
  mongoose.model("SuperAdminAnnouncement", announcementSchema, "superadmin_announcements");
