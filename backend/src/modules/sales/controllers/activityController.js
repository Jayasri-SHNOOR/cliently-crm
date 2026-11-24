const mongoose = require("mongoose");
const Activity = require("../models/activity");

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

const getActivities = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const activities = await Activity.find({
      tenantId,
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

const updateActivity = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const allowedFields = ["description", "activityDate", "status"];
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
      (typeof updates.description !== "string" || !updates.description.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Meeting description cannot be empty",
      });
    }

    const meeting = await Activity.findOneAndUpdate(
      { _id: id, tenantId, activityType: "Meeting" },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
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

const deleteActivity = async (req, res) => {
  try {
    const tenantId = getTenantId(req, res);
    if (!tenantId) return;

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid meeting ID",
      });
    }

    const meeting = await Activity.findOneAndDelete({
      _id: id,
      tenantId,
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