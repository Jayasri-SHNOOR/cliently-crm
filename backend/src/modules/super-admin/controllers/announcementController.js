
const mongoose = require("mongoose");
const Announcement = require("../announcements/announcementModel");

const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: announcements.length,
      data: announcements,
    });
  } catch (error) {
    console.error("Get announcements error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve announcements",
    });
  }
};

const createAnnouncement = async (req, res) => {
  try {
    const { title, message, type, status } = req.body;

    if (
      typeof title !== "string" ||
      !title.trim() ||
      typeof message !== "string" ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      type,
      status,
      publishedAt: status === "Published" ? new Date() : null,
    });

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      data: announcement,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement data",
      });
    }

    console.error("Create announcement error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create announcement",
    });
  }
};

const publishAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID",
      });
    }

    const announcement = await Announcement.findByIdAndUpdate(
      id,
      {
        $set: {
          status: "Published",
          publishedAt: new Date(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement published successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Publish announcement error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to publish announcement",
    });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement,
  publishAnnouncement,
};
