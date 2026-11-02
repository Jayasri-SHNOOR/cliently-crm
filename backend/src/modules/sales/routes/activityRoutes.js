
const express = require("express");
const router = express.Router();

const {
  getActivities,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");

// GET all meetings
router.get("/", getActivities);

// EDIT a meeting
router.put("/:id", updateActivity);

// DELETE a meeting
router.delete("/:id", deleteActivity);

module.exports = router;
