
const mongoose = require("mongoose");
const Lead = require("../../../models/Lead");

// Escape special characters in search input
const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Get all leads belonging to the logged-in user's tenant
const getLeads = async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    const { search, status } = req.query;

    const filter = {
      tenantId: req.user.tenantId,
    };

    if (search?.trim()) {
      const searchRegex = {
        $regex: escapeRegex(search.trim()),
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
      filter.status = status;
    }

    const leads = await Lead.find(filter).sort({ createdAt: -1 });

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

// Get one lead
const getLeadById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

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

// Create a lead
const createLead = async (req, res) => {
  try {
    if (!req.user?.tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    const {
      name,
      email,
      company,
      phone,
      status,
      value,
      productInterested,
      source,
      productId,
      productName,
      message,
    } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Lead name is required",
      });
    }

    const lead = await Lead.create({
      tenantId: req.user.tenantId,
      name,
      email,
      company,
      phone,
      status,
      value,
      productInterested,
      source,
      productId,
      productName,
      message,
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

// Update a lead
const updateLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

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
        tenantId: req.user.tenantId,
      },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

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

// Delete a lead
const deleteLead = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid lead ID",
      });
    }

    const lead = await Lead.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId,
    });

    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found",
      });
    }

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
