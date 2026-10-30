
const mongoose = require("mongoose");
const Plan = require("../planModel");


const getPlans = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, parseInt(req.query.limit, 10) || 10)
    );
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      Plan.find()
        .sort({ price: 1, _id: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Plan.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get plans error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve plans",
    });
  }
};


const getPlanById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    const data = await Plan.findById(req.params.id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get plan error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve plan",
    });
  }
};

const createPlan = async (req, res) => {
  try {
    const { name, price, billingCycle, description, features, isActive } =
      req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "name and price are required",
      });
    }

    const data = await Plan.create({
      name,
      price,
      billingCycle,
      description,
      features,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Plan created successfully",
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this name already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create plan error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to create plan",
    });
  }
};

const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    const allowedFields = [
      "name",
      "price",
      "billingCycle",
      "description",
      "features",
      "isActive",
    ];

    const updates = {};

    for (const field of allowedFields) {
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

    const data = await Plan.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan updated successfully",
      data,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A plan with this name already exists",
      });
    }

    if (error.name === "ValidationError" || error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Update plan error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to update plan",
    });
  }
};

const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan ID",
      });
    }

    const data = await Plan.findByIdAndDelete(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Plan not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Plan deleted successfully",
    });
  } catch (error) {
    console.error("Delete plan error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to delete plan",
    });
  }
};

module.exports = {
  getPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
};
