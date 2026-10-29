const Tenant = require("../tenantModel");
// GET: Fetch all tenants
const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Get tenants error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch tenants",
    });
  }
};

// GET: Fetch one tenant by ID
const getTenantById = async (req, res) => {
  try {
    const tenant = await Tenant.findById(req.params.id);

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

    return res.status(
      error.name === "CastError" ? 400 : 500
    ).json({
      success: false,
      message: error.message || "Failed to fetch tenant",
    });
  }
};

// POST: Create a tenant
const createTenant = async (req, res) => {
  try {
    const { company, admin, plan, environment, status, date } =
      req.body || {};

    // Check required fields
    if (
      !company?.trim() ||
      !admin?.trim() ||
      !plan ||
      !environment?.trim() ||
      !status ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide company, admin, plan, environment, status and date.",
      });
    }

    // Match the values defined in tenantModel.js
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
      error.name === "ValidationError" ? 400 : 500
    ).json({
      success: false,
      message: error.message || "Failed to create tenant",
    });
  }
};

// PUT: Update a tenant
const updateTenant = async (req, res) => {
  try {
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

    const tenant = await Tenant.findByIdAndUpdate(
      req.params.id,
      updates,
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
      error.name === "ValidationError" ? 400 :
      error.name === "CastError" ? 400 : 500
    ).json({
      success: false,
      message: error.message || "Failed to update tenant",
    });
  }
};

// DELETE: Delete a tenant
const deleteTenant = async (req, res) => {
  try {
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

    return res.status(
      error.name === "CastError" ? 400 : 500
    ).json({
      success: false,
      message: error.message || "Failed to delete tenant",
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
