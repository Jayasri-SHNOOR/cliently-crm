
const mongoose = require("mongoose");
const Subscription = require("../subscriptionModel");

const getSubscriptions = async (req, res) => {
  try {
    const data = await Subscription.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Get subscriptions error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve subscriptions",
    });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription ID",
      });
    }

    const data = await Subscription.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve subscription",
    });
  }
};

const createSubscription = async (req, res) => {
  try {
    const { company, plan, status, billingCycle, amount, startDate, endDate } =
      req.body;

    if (!company?.trim() || !plan || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: "company, plan and amount are required",
      });
    }

    const data = await Subscription.create({
      company: company.trim(),
      plan,
      status,
      billingCycle,
      amount,
      startDate,
      endDate,
    });

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create subscription",
    });
  }
};

const updateSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription ID",
      });
    }

    const allowed = [
      "company",
      "plan",
      "status",
      "billingCycle",
      "amount",
      "startDate",
      "endDate",
    ];

    const updates = {};
    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update",
      });
    }

    const data = await Subscription.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription updated successfully",
      data,
    });
  } catch (error) {
    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update subscription",
    });
  }
};

const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription ID",
      });
    }

    const data = await Subscription.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Delete subscription error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete subscription",
    });
  }
};

module.exports = {
  getSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
};
