const mongoose = require("mongoose");
const Lead = require("../../../models/Lead");
const Employee = require("../../../models/Employee");

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getOwner = (req, res) => {
  const tenantId = req.user?.tenantId;
  const employeeId = req.user?.employeeId;

  if (!tenantId) {
    res.status(403).json({
      success: false,
      message: "Tenant information is missing",
    });
    return null;
  }

  if (!employeeId) {
    res.status(403).json({
      success: false,
      message: "Your login is not linked to an employee record. Please contact your admin.",
    });
    return null;
  }

  return { tenantId, employeeId };
};

const invalidId = (res) =>
  res.status(400).json({
    success: false,
    message: "Invalid lead ID",
  });

const notFound = (res) =>
  res.status(404).json({
    success: false,
    message: "Lead not found",
  });

const getLeads = async (req, res) => {
  try {
    const owner = getOwner(req, res);
    if (!owner) return;

    const { search, status } = req.query;

    const filter = {
      tenantId: owner.tenantId,
      executiveId: owner.employeeId,
    };

    if (search?.trim()) {
      const searchRegex = {
        $regex: escapeRegex(search.trim().slice(0, 50)),
        $options: "i",
      };

      filter.$or = [
        { name: searchRegex },
        { company: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    if (status && status !== "All") {
      filter.status = String(status);
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 }).limit(500);

    res.status(200).json({
      success: true,
      count: leads.length,
      data: leads,
    });
  } catch (error) {
    console.error("Get leads error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch leads",
    });
  }
};

const getLeadById = async (req, res) => {
  try {
    const owner = getOwner(req, res);
    if (!owner) return;

    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: owner.tenantId,
      executiveId: owner.employeeId,
    });

    if (!lead) return notFound(res);

    res.status(200).json({
      success: true,
      data: lead,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch lead",
    });
  }
};

const createLead = async (req, res) => {
  try {
    const owner = getOwner(req, res);
    if (!owner) return;

    const {
      name,
      email,
      company,
      phone,
      status,
      value,
      productInterested,
      productId,
      productName,
      message,
    } = req.body;

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lead name is required",
      });
    }

    const employee = await Employee.findOne({
      _id: owner.employeeId,
      tenantId: owner.tenantId,
    })
      .select("name")
      .lean();

    const lead = await Lead.create({
      tenantId: owner.tenantId,
      name,
      email,
      company,
      phone,
      status,
      value,
      productInterested,
      source: "Manual",
      productId: mongoose.isValidObjectId(productId) ? productId : null,
      productName,
      message,
      executiveId: owner.employeeId,
      executive: employee?.name || req.user.name || "",
      assignedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Lead created successfully",
      data: lead,
    });
  } catch (error) {
    console.error("Create lead error:", error.message);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const updateLead = async (req, res) => {
  try {
    const owner = getOwner(req, res);
    if (!owner) return;

    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const allowedFields = [
      "name",
      "email",
      "company",
      "phone",
      "status",
      "value",
      "productInterested",
      "productId",
      "productName",
      "message",
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
        message: "No valid fields provided for update",
      });
    }

    const lead = await Lead.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId: owner.tenantId,
        executiveId: owner.employeeId,
      },
      { $set: updates },
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!lead) return notFound(res);

    res.status(200).json({
      success: true,
      message: "Lead updated successfully",
      data: lead,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteLead = async (req, res) => {
  try {
    const owner = getOwner(req, res);
    if (!owner) return;

    if (!mongoose.isValidObjectId(req.params.id)) return invalidId(res);

    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      tenantId: owner.tenantId,
      executiveId: owner.employeeId,
      source: "Manual",
    });

    if (!lead) return notFound(res);

    res.status(200).json({
      success: true,
      message: "Lead deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete lead",
    });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};