
const mongoose = require("mongoose");
const Integration = require("../integrationModel");

// GET all integrations
const getIntegrations = async (req, res) => {
  try {
    console.log("========== INTEGRATIONS DEBUG ==========");
    console.log("Connected database:", mongoose.connection.name);
    console.log("Integration collection:", Integration.collection.name);

    const data = await Integration.find().sort({ name: 1 });

    console.log("Integrations found:", data.length);
    console.log("========================================");

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Get integrations error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integrations",
      error: error.message,
    });
  }
};

// GET integration by ID
const getIntegrationById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    const data = await Integration.findById(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Get integration by ID error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch integration",
      error: error.message,
    });
  }
};

// UPDATE integration
const updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid integration ID",
      });
    }

    const allowedFields = ["name", "description", "enabled"];
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

    const data = await Integration.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Integration not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Integration updated successfully",
      data,
    });
  } catch (error) {
    console.error("Update integration error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update integration",
      error: error.message,
    });
  }
};

module.exports = {
  getIntegrations,
  getIntegrationById,
  updateIntegration,
};
