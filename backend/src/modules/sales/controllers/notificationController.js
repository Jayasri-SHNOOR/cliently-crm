
const mongoose = require("mongoose");
const Notification = require("../models/notification");

// GET /api/notifications - Fetch notifications
const getNotifications = async (req, res) => {
  try {
    const { isRead, type } = req.query;
    const filter = {};

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    if (type) {
      filter.type = type;
    }

    const notifications = await Notification.find(filter).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error("Get notifications error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

// GET /api/notifications/:id - Fetch one notification
const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("Get notification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notification",
    });
  }
};

// POST /api/notifications - Create a notification
const createNotification = async (req, res) => {
  try {
    const { title, message, type, isRead } = req.body;

    if (!title?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      isRead,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Create notification error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// PATCH /api/notifications/:id/read - Mark as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Mark notification read error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update notification",
    });
  }
};

// DELETE /api/notifications/:id - Delete a notification
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid notification ID",
      });
    }

    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

module.exports = {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
};
