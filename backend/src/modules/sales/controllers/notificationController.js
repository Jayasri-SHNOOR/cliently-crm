const mongoose = require("mongoose");
const Notification = require("../models/notification");

const getTenantId = (req, res) => {
  const tenantId = req.user?.tenantId;
  if (!tenantId) {
    res.status(403).json({
      success: false,
      message: "Tenant information is missing",
    });
    return null;
  }
  return tenantId;
};

const invalidId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid notification ID",
  });

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Notification not found",
  });

const getNotifications = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { isRead, type } = req.query;
    const filter = { tenantId };

    if (isRead !== undefined) {
      filter.isRead = isRead === "true";
    }

    if (type) {
      filter.type = String(type);
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(200);

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

const getNotificationById = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);

    const notification = await Notification.findOne({ _id: id, tenantId });
    if (!notification) return notFound(res);

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

const createNotification = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { title, message, type } = req.body;

    if (typeof title !== "string" || !title.trim() || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Title and message are required",
      });
    }

    const notification = await Notification.create({
      tenantId,
      title,
      message,
      type,
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

const markNotificationAsRead = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);

    const notification = await Notification.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: { isRead: true } },
      { returnDocument: "after" }
    );
    if (!notification) return notFound(res);

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

const deleteNotification = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return invalidId(res);

    const notification = await Notification.findOneAndDelete({ _id: id, tenantId });
    if (!notification) return notFound(res);

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