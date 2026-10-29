const express = require("express");
const router = express.Router();

const {
  getNotifications,
  createNotification,
  markNotificationRead,
} = require("../controllers/notificationController");

router.get("/", getNotifications);
router.post("/", createNotification);
router.patch("/:id/read", markNotificationRead);

module.exports = router;
