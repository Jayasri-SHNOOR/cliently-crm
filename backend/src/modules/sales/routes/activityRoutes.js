const express = require("express");
const {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
} = require("../controllers/activityController");

const router = express.Router();

router.get("/", getActivities);
router.post("/", createActivity);
router.put("/:id", updateActivity);
router.delete("/:id", deleteActivity);

module.exports = router;