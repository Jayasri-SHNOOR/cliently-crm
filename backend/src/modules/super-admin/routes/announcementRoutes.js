const express = require("express");
const router = express.Router();

const {
  getAnnouncements,
  createAnnouncement,
  publishAnnouncement,
} = require("../controllers/announcementController");

router.get("/", getAnnouncements);
router.post("/", createAnnouncement);
router.patch("/:id/publish", publishAnnouncement);

module.exports = router;
