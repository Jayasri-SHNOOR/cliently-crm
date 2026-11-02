
const mongoose = require("mongoose");
const Activity = require("../models/activity");

// GET /api/activities - Fetch meetings
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({
      activityType: "Meeting",
    }).sort({ activityDate: 1 });

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get activities error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch meetings",
    });
  }
};

// PUT /api/activities/:id - Edit a meeting
const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const allowedFields = [
      "description",
      "activityDate",
      "status",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide a description, date, or status to update",
      });
    }

    if (
      updates.description !== undefined &&
      !updates.description.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Meeting description cannot be empty",
      });
    }

    const meeting = await Activity.findOneAndUpdate(
      { _id: id, activityType: "Meeting" },
      updates,
      { new: true, runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting updated successfully",
      meeting,
    });
  } catch (error) {
    console.error("Update meeting error:", error.message);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// DELETE /api/activities/:id - Delete a meeting
const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const meeting = await Activity.findOneAndDelete({
      _id: id,
      activityType: "Meeting",
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Meeting deleted successfully",
    });
  } catch (error) {
    console.error("Delete meeting error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete meeting",
    });
  }
};

module.exports = {
  getActivities,
  updateActivity,
  deleteActivity,
};
