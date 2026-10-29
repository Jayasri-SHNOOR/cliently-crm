const mongoose = require("mongoose");
const SecurityLog = require("../securityLogModel");

const getSecurityLogs = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const [data, total] = await Promise.all([
      SecurityLog.find()
        .select("-__v")
        .sort({ occurredAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      SecurityLog.countDocuments(),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get security logs error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security logs",
    });
  }
};

const getSecurityLogById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid security log ID",
      });
    }

    const data = await SecurityLog.findById(id).select("-__v").lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Security log not found",
      });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Get security log error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve security log",
    });
  }
};


const createSecurityLog = async (req, res) => {
  try {
    const { event, category, severity, actor, details } = req.body;

    if (typeof event !== "string" || !event.trim()) {
      return res.status(400).json({
        success: false,
        message: "A security event description is required",
      });
    }

    const data = await SecurityLog.create({
      event: event.trim(),
      category,
      severity,
      actor,
      details,
    });

    res.status(201).json({
      success: true,
      message: "Security event recorded",
      data,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    console.error("Create security log error:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to record security event",
    });
  }
};

module.exports = {
  getSecurityLogs,
  getSecurityLogById,
  createSecurityLog,
};
