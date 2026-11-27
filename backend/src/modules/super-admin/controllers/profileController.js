const { sessionConfig } = require("../../../config/session");

function withSecurityDetails(user, req) {
  return {
    ...user,
    security: {
      authentication: "Firebase and CRM sessions",
      accessTokenMinutes: sessionConfig.accessTokenTtlSeconds / 60,
      idleTimeoutMinutes: sessionConfig.idleTimeoutMs / 60000,
      maximumSessionHours: sessionConfig.absoluteTimeoutMs / 3600000,
      sessionExpiresAt: req.authSession?.expiresAt || null,
      mfaStatus: "Not available"
    }
  };
}

const User = require("../../../models/User");

const PROFILE_FIELDS =
  "name email mobileNumber role status lastLoginAt createdAt updatedAt";

function ownAccount(req) {
  return {
    _id: req.user.id,
    role: "SUPER_ADMIN",
    tenantId: null,
    status: "Active"
  };
}

async function getProfile(req, res, next) {
  try {
    const user = await User.findOne(ownAccount(req))
      .select(PROFILE_FIELDS)
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    return res.json({ user: withSecurityDetails(user, req) });

  } catch (error) {
    next(error);
  }
}

async function updateProfile(req, res, next) {
  try {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        message: "Invalid profile data."
      });
    }

    const allowedFields = ["name", "mobileNumber"];
    const keys = Object.keys(body);

    if (!keys.length || keys.some(key => !allowedFields.includes(key))) {
      return res.status(400).json({
        message: "Only name and mobile number can be updated."
      });
    }

    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, "name")) {
      if (
        typeof body.name !== "string" ||
        !body.name.trim() ||
        body.name.trim().length > 100
      ) {
        return res.status(400).json({
          message: "Name must contain 1 to 100 characters."
        });
      }

      updates.name = body.name.trim();
    }

    if (Object.prototype.hasOwnProperty.call(body, "mobileNumber")) {
      if (typeof body.mobileNumber !== "string") {
        return res.status(400).json({
          message: "Invalid mobile number."
        });
      }

      const mobile = body.mobileNumber.trim();

      if (
        mobile.length > 20 ||
        (mobile && (
          !/^\+?[\d\s()-]+$/.test(mobile) ||
          mobile.replace(/\D/g, "").length < 7 ||
          mobile.replace(/\D/g, "").length > 15
        ))
      ) {
        return res.status(400).json({
          message: "Please enter a valid mobile number."
        });
      }

      updates.mobileNumber = mobile;
    }

    const user = await User.findOneAndUpdate(
      ownAccount(req),
      { $set: updates },
      { new: true, runValidators: true }
    )
      .select(PROFILE_FIELDS)
      .lean();

    if (!user) {
      return res.status(404).json({
        message: "Profile not found."
      });
    }

    const auditRecorded = await recordProfileActivity(req, {
      event: "Profile updated",
      action: "profile.updated",
      category: "Configuration",
      severity: "Low",
      resourceType: "User",
      resourceId: req.user.id,
      details: `Submitted fields: ${Object.keys(updates).join(", ")}`
    });

    return res.json({
      message: "Profile updated successfully.",
      auditRecorded,
      user: withSecurityDetails(user, req)
    });

  } catch (error) {
    next(error);
  }
}

module.exports = {
  getProfile,
  updateProfile
};

const Session = require("../../../models/Session");

function activeSessionFilter(req) {
  const now = Date.now();

  return {
    userId: req.user.id,
    tenantId: null,
    revokedAt: null,
    expiresAt: { $gt: new Date(now) },
    lastActivityAt: {
      $gte: new Date(now - sessionConfig.idleTimeoutMs)
    }
  };
}

async function listOwnSessions(req, res, next) {
  try {
    const sessions = await Session.find(activeSessionFilter(req))
      .select("_id userAgent createdAt lastActivityAt expiresAt")
      .sort({ lastActivityAt: -1 })
      .lean();

    res.set("Cache-Control", "no-store");

    return res.json({
      sessions: sessions.map(session => ({
        id: String(session._id),
        userAgent: session.userAgent || "Unknown browser",
        createdAt: session.createdAt,
        lastActivityAt: session.lastActivityAt,
        expiresAt: session.expiresAt,
        current: String(session._id) === String(req.authSession.id)
      }))
    });
  } catch (error) {
    next(error);
  }
}

async function revokeOwnSession(req, res, next) {
  try {
    const id = req.params.id;

    if (!/^[a-fA-F0-9]{24}$/.test(id)) {
      return res.status(400).json({
        message: "Invalid session ID."
      });
    }

    if (id.toLowerCase() === String(req.authSession.id).toLowerCase()) {
      return res.status(400).json({
        message: "Use Logout to end your current session."
      });
    }

    const result = await Session.updateOne(
      {
        ...activeSessionFilter(req),
        _id: id
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: "logout"
        }
      },
      { runValidators: true }
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        message: "Active session not found."
      });
    }

    const auditRecorded = await recordProfileActivity(req, {
      event: "Session revoked",
      action: "profile.session_revoked",
      category: "Authentication",
      severity: "Medium",
      resourceType: "Session",
      resourceId: id,
      details: "Administrator revoked another own session."
    });

    return res.json({
      message: "Session revoked successfully.",
      auditRecorded
    });
  } catch (error) {
    next(error);
  }
}

module.exports.listOwnSessions = listOwnSessions;
module.exports.revokeOwnSession = revokeOwnSession;


const SecurityLog = require("../securityLogModel");
const { recordAuditEvent } = require("../services/auditService");

async function recordProfileActivity(req, eventData) {
  try {
    await recordAuditEvent({
      req,
      ...eventData
    });
    return true;
  } catch (error) {
    console.error("Profile audit recording failed:", error.name);
    return false;
  }
}

async function listOwnActivity(req, res, next) {
  try {
    const activity = await SecurityLog.find({
      actorId: String(req.user.id)
    })
      .select("_id event action category severity occurredAt")
      .sort({ occurredAt: -1, _id: -1 })
      .limit(30)
      .lean();

    res.set("Cache-Control", "no-store");

    return res.json({ activity });
  } catch (error) {
    next(error);
  }
}

module.exports.listOwnActivity = listOwnActivity;
