
const mongoose = require("mongoose");
const Tenant = require("../tenantModel");

const {
  recordAuditEvent,
} = require("../services/auditService");

// ============================================
// GET ALL TENANTS
// ============================================

const getTenants = async (req, res) => {
  try {
    const tenants = await Tenant.find().sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: tenants.length,
      data: tenants,
    });
  } catch (error) {
    console.error("Get tenants error:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to fetch tenants",
    });
  }
};

// ============================================
// GET TENANT BY ID
// ============================================

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
      message:
        error.message || "Failed to fetch tenant",
    });
  }
};

// ============================================
// CREATE TENANT + AUDIT LOG
// ============================================

const createTenant = async (req, res) => {
  try {
    const {
      company,
      admin,
      email,
      plan,
      environment,
      status,
      date,
    } = req.body || {};

    if (
      typeof company !== "string" ||
      !company.trim() ||
      typeof admin !== "string" ||
      !admin.trim() ||
      !plan ||
      typeof environment !== "string" ||
      !environment.trim() ||
      !status ||
      !date
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide company, admin, plan, environment, status and date.",
      });
    }

    const allowedPlans = [
      "Starter",
      "Pro",
      "Enterprise",
    ];

    const allowedStatuses = [
      "Active",
      "Pending",
      "Blocked",
    ];

    if (!allowedPlans.includes(plan)) {
      return res.status(400).json({
        success: false,
        message:
          "Plan must be Starter, Pro, or Enterprise.",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message:
          "Status must be Active, Pending, or Blocked.",
      });
    }

    let tenant;

    await mongoose.connection.transaction(
      async (session) => {
        const created = await Tenant.create(
          [
            {
              company: company.trim(),
              admin: admin.trim(),
              email:
                typeof email === "string"
                  ? email.trim()
                  : "",
              plan,
              environment: environment.trim(),
              status,
              date,
            },
          ],
          { session }
        );

        tenant = created[0];

        await recordAuditEvent({
          req,
          event: "Tenant created",
          action: "tenant.created",
          category: "Configuration",
          severity: "Medium",
          resourceType: "Tenant",
          resourceId: tenant._id,
          tenantId: tenant._id,
          details:
            "A new tenant was created by a Super Admin.",
          session,
        });
      }
    );

    return res.status(201).json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  } catch (error) {
    console.error("Create tenant error:", error);

    const validationError =
      error.name === "ValidationError" ||
      error.name === "CastError";

    return res.status(
      validationError ? 400 : 500
    ).json({
      success: false,
      message: validationError
        ? error.message
        : "Failed to create tenant",
    });
  }
};

// ============================================
// UPDATE TENANT + AUDIT LOG
// ============================================

const updateTenant = async (req, res) => {
  try {
    const allowedFields = [
      "company",
      "admin",
      "email",
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
        message:
          "Provide at least one valid field to update.",
      });
    }

    let tenant;
    let notFound = false;

    await mongoose.connection.transaction(
      async (session) => {
        const previous = await Tenant.findById(
          req.params.id
        ).session(session);

        if (!previous) {
          notFound = true;
          return;
        }

        const oldStatus = previous.status;
        const oldPlan = previous.plan;

        tenant = await Tenant.findByIdAndUpdate(
          req.params.id,
          updates,
          {
            new: true,
            runValidators: true,
            session,
          }
        );

        const changes = Object.keys(updates).filter(
          (field) =>
            String(previous[field] ?? "") !==
            String(tenant[field] ?? "")
        );

        // No audit entry for an unchanged record.
        if (changes.length === 0) return;

        let action = "tenant.updated";
        let event = "Tenant updated";
        let severity = "Low";

        if (
          oldStatus !== tenant.status &&
          tenant.status === "Blocked"
        ) {
          action = "tenant.blocked";
          event = "Tenant blocked";
          severity = "High";
        } else if (
          oldStatus !== tenant.status &&
          tenant.status === "Active"
        ) {
          action = "tenant.activated";
          event = "Tenant activated";
          severity = "Medium";
        } else if (
          oldPlan !== tenant.plan &&
          changes.length === 1
        ) {
          action = "tenant.plan_changed";
          event = "Tenant plan changed";
          severity = "Medium";
        }

        await recordAuditEvent({
          req,
          event,
          action,
          category: "Configuration",
          severity,
          resourceType: "Tenant",
          resourceId: tenant._id,
          tenantId: tenant._id,
          details:
            `Updated fields: ${changes.join(", ")}`,
          session,
        });
      }
    );

    if (notFound) {
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

    const validationError =
      error.name === "ValidationError" ||
      error.name === "CastError";

    return res.status(
      validationError ? 400 : 500
    ).json({
      success: false,
      message: validationError
        ? error.message
        : "Failed to update tenant",
    });
  }
};

// ============================================
// DELETE TENANT + AUDIT LOG
// ============================================

const deleteTenant = async (req, res) => {
  try {
    let tenant;
    let notFound = false;

    await mongoose.connection.transaction(
      async (session) => {
        tenant = await Tenant.findByIdAndDelete(
          req.params.id,
          { session }
        );

        if (!tenant) {
          notFound = true;
          return;
        }

        await recordAuditEvent({
          req,
          event: "Tenant deleted",
          action: "tenant.deleted",
          category: "Configuration",
          severity: "High",
          resourceType: "Tenant",
          resourceId: tenant._id,
          tenantId: tenant._id,
          details:
            "A tenant was deleted by a Super Admin.",
          session,
        });
      }
    );

    if (notFound) {
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
      message:
        error.name === "CastError"
          ? error.message
          : "Failed to delete tenant",
    });
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
};
