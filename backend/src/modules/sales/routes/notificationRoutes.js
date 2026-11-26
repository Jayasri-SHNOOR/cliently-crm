
const express = require("express");
const router = express.Router();

const {
  getNotifications,
  getNotificationById,
  createNotification,
  markNotificationAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// GET all notifications and POST a new notification
router.route("/")
  .get(getNotifications)
  .post(createNotification);

// Mark a notification as read
router.patch("/:id/read", markNotificationAsRead);

// GET or DELETE a notification by ID
router.route("/:id")
  .get(getNotificationById)
  .delete(deleteNotification);

module.exports = router;
