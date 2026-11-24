
const mongoose = require("mongoose");
const SecurityLog = require("../securityLogModel");

const categories = [
  "Authentication",
  "Authorization",
  "Data Access",
  "Configuration",
  "System",
  "General",
];

const severities = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

const escapeRegex = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSecurityLogs = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query.limit, 10) || 20
      )
    );

    const {
      search,
      category,
      severity,
      tenantId,
      actor,
      action,
      from,
      to,
    } = req.query;

    const filter = {};

    if (category) {
      if (!categories.includes(category)) {
        return res.status(400).json({
          success: false,
          message: "Invalid category",
        });
      }

      filter.category = category;
    }

    if (severity) {
      if (!severities.includes(severity)) {
        return res.status(400).json({
          success: false,
          message: "Invalid severity",
        });
      }

      filter.severity = severity;
    }

    for (const [key, value] of Object.entries({
      tenantId,
      actor,
      action,
    })) {
      if (value !== undefined) {
        if (
          typeof value !== "string" ||
          value.length > 150
        ) {
          return res.status(400).json({
            success: false,
            message: `Invalid ${key} filter`,
          });
        }

        filter[key] = value;
      }
    }

    if (search !== undefined) {
      if (
        typeof search !== "string" ||
        search.length > 150
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid search query",
        });
      }

      const term = search.trim();

      if (term) {
        const pattern = new RegExp(
          escapeRegex(term),
          "i"
        );

        filter.$or = [
          { event: pattern },
          { actor: pattern },
          { action: pattern },
          { resourceType: pattern },
          { resourceId: pattern },
          { details: pattern },
          { correlationId: pattern },
        ];
      }
    }

    if (from || to) {
      filter.occurredAt = {};

      if (from) {
        const start = new Date(from);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date",
          });
        }

        filter.occurredAt.$gte = start;
      }

      if (to) {
        const end = new Date(to);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date",
          });
        }

        filter.occurredAt.$lte = end;
      }

      if (
        filter.occurredAt.$gte &&
        filter.occurredAt.$lte &&
        filter.occurredAt.$gte > filter.occurredAt.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "Start date must precede end date",
        });
      }
    }

    const [data, total] = await Promise.all([
      SecurityLog.find(filter)
        .select("-__v")
        .sort({ occurredAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),

      SecurityLog.countDocuments(filter),
    ]);

    return res.status(200).json({
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
    console.error(
      "Get security logs error:",
      error.message
    );

    return res.status(500).json({
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

    const data = await SecurityLog.findById(id)
      .select("-__v")
      .lean();

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Security log not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "Get security log error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve security log",
    });
  }
};

const createSecurityLog = async (req, res) => {
  try {
    const {
      event,
      category,
      severity,
      details,
      action,
      resourceType,
      resourceId,
      correlationId,
    } = req.body;

    if (
      typeof event !== "string" ||
      !event.trim() ||
      event.length > 500
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid event description is required",
      });
    }

    // Actor and tenant identity must come from
    // verified server-side authentication context.
    // This endpoint must be protected before use.

    const data = await SecurityLog.create({
      event: event.trim(),
      category,
      severity,
      details,
      action,
      resourceType,
      resourceId,
      correlationId,
    });

    return res.status(201).json({
      success: true,
      message: "Security event recorded",
      data,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Invalid security log data",
      });
    }

    console.error(
      "Create security log error:",
      error.message
    );

    return res.status(500).json({
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
