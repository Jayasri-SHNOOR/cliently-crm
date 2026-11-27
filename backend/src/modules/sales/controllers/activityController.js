const mongoose = require("mongoose");
const Activity = require("../models/activity");
const Customer = require("../models/Customer");

const MEETING_STATUSES = ["Pending", "Completed", "Cancelled"];

const ownerFilter = (req) => ({
  tenantId: req.user.tenantId,
  userId: req.user.id,
  activityType: "Meeting",
});

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

function readDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function checkCustomer(req, customerId) {
  if (!customerId) return null;
  if (!mongoose.isValidObjectId(customerId)) return undefined;
  const customer = await Customer.findOne({ _id: customerId, tenantId: req.user.tenantId })
    .select("_id")
    .lean();
  return customer ? customer._id : undefined;
}

const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find(ownerFilter(req))
      .populate("customerId", "name customerCode")
      .sort({ activityDate: 1 })
      .lean();

    res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("Get activities error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch meetings" });
  }
};

const createActivity = async (req, res) => {
  try {
    const { description, activityDate, customerId } = req.body;

    if (typeof description !== "string" || !description.trim()) {
      return badRequest(res, "Meeting description is required");
    }

    const date = readDate(activityDate);
    if (!date) return badRequest(res, "A valid meeting date and time is required");

    const customer = await checkCustomer(req, customerId);
    if (customer === undefined) return badRequest(res, "Customer not found");

    const meeting = await Activity.create({
      tenantId: req.user.tenantId,
      userId: req.user.id,
      employeeId: req.user.employeeId || null,
      customerId: customer,
      activityType: "Meeting",
      description: description.trim().slice(0, 500),
      activityDate: date,
      status: "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Meeting added",
      meeting,
    });
  } catch (error) {
    console.error("Create meeting error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid meeting ID");

    const updates = {};

    if (req.body.description !== undefined) {
      if (typeof req.body.description !== "string" || !req.body.description.trim()) {
        return badRequest(res, "Meeting description cannot be empty");
      }
      updates.description = req.body.description.trim().slice(0, 500);
    }

    if (req.body.activityDate !== undefined) {
      const date = readDate(req.body.activityDate);
      if (!date) return badRequest(res, "A valid meeting date and time is required");
      updates.activityDate = date;
    }

    if (req.body.status !== undefined) {
      if (!MEETING_STATUSES.includes(req.body.status)) return badRequest(res, "Invalid meeting status");
      updates.status = req.body.status;
    }

    if (req.body.customerId !== undefined) {
      const customer = await checkCustomer(req, req.body.customerId);
      if (customer === undefined) return badRequest(res, "Customer not found");
      updates.customerId = customer;
    }

    if (Object.keys(updates).length === 0) {
      return badRequest(res, "Provide a description, date, status or customer to update");
    }

    const meeting = await Activity.findOneAndUpdate(
      { _id: id, ...ownerFilter(req) },
      { $set: updates },
      { returnDocument: "after", runValidators: true }
    );

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    res.status(200).json({ success: true, message: "Meeting updated", meeting });
  } catch (error) {
    console.error("Update meeting error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid meeting ID");

    const meeting = await Activity.findOneAndDelete({ _id: id, ...ownerFilter(req) });

    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    res.status(200).json({ success: true, message: "Meeting deleted" });
  } catch (error) {
    console.error("Delete meeting error:", error.message);
    res.status(500).json({ success: false, message: "Failed to delete meeting" });
  }
};

module.exports = {
  getActivities,
  createActivity,
  updateActivity,
  deleteActivity,
};