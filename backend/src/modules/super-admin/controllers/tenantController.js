
const mongoose = require("mongoose");
const Tenant = require("../tenantModel");

const getTenants = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const requestedLimit = parseInt(req.query.limit, 10) || 10;
    const limit = Math.min(100, Math.max(1, requestedLimit));
    const skip = (page - 1) * limit;

    const [tenants, total] = await Promise.all([
      Tenant.find()
        .sort({ createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tenant.countDocuments(),
    ]);

    return res.status(200).json({
      success: true,
      data: tenants,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get tenants error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenants",
    });
  }
};

const getTenantById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await Tenant.findById(req.params.id).lean();

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error("Get tenant by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenant",
    });
  }
};

const createTenant = async (req, res) => {
  try {
    const { company, admin, plan, environment, status, date } =
      req.body || {};

    if (
      typeof company !== "string" ||
      !company.trim() ||
      typeof admin !== "string" ||
      !admin.trim() ||
      typeof environment !== "string" ||
      !environment.trim() ||
      !plan ||
      !status ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide company, admin, plan, environment, status and date.",
      });
    }

    const allowedPlans = ["Starter", "Pro", "Enterprise"];
    const allowedStatuses = ["Active", "Pending", "Blocked"];

    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message: "Plan must be Starter, Pro, or Enterprise.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active, Pending, or Blocked.",
      });
    }

    const tenant = await Tenant.create({
      company: company.trim(),
      admin: admin.trim(),
      plan,
      environment: environment.trim(),
      status,
      date,
    });

    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Create tenant error:", error);

    return res.status(
      error.name === "ValidationError" ||
        error.name === "CastError"
        ? 400
        : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError" ||
        error.name === "CastError"
          ? error.message
          : "Failed to create tenant",
    });
  }
};

const updateTenant = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const allowedFields = [
      "company",
      "admin",
      "plan",
      "environment",
      "status",
      "date",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (req.body?.[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid field to update.",
      });
    }

    if (
      updates.company !== undefined &&
      (typeof updates.company !== "string" ||
        !updates.company.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Company must be a non-empty string.",
      });
    }

    if (
      updates.admin !== undefined &&
      (typeof updates.admin !== "string" ||
        !updates.admin.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Admin must be a non-empty string.",
      });
    }

    if (
      updates.environment !== undefined &&
      (typeof updates.environment !== "string" ||
        !updates.environment.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Environment must be a non-empty string.",
      });
    }

    if (
      updates.plan !== undefined &&
      !["Starter", "Pro", "Enterprise"].includes(updates.plan)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan.",
      });
    }

    if (
      updates.status !== undefined &&
      !["Active", "Pending", "Blocked"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid status.",
      });
    }

    if (typeof updates.company === "string") {
      updates.company = updates.company.trim();
    }

    if (typeof updates.admin === "string") {
      updates.admin = updates.admin.trim();
    }

    if (typeof updates.environment === "string") {
      updates.environment = updates.environment.trim();
    }

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Update tenant error:", error);

    return res.status(
      error.name === "ValidationError" ||
        error.name === "CastError"
        ? 400
        : 500
    ).json({
      success: false,
      message:
        error.name === "ValidationError" ||
        error.name === "CastError"
          ? error.message
          : "Failed to update tenant",
    });
  }
};

const deleteTenant = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tenant ID",
      });
    }

    const tenant = await Tenant.findByIdAndDelete(req.params.id);

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tenant deleted successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Delete tenant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete tenant",
    });
  }
};

module.exports = {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
};
