
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");

const securityLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      default: randomUUID,
      immutable: true,
      unique: true,
    },

    event: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    category: {
      type: String,
      enum: [
        "Authentication",
        "Authorization",
        "Data Access",
        "Configuration",
        "System",
        "General",
      ],
      default: "General",
    },

    severity: {
      type: String,
      enum: ["Low", "Medium", "High", "Critical"],
      default: "Low",
    },

    actor: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "System",
    },

    actorId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    tenantId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    action: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    resourceType: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    resourceId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    correlationId: {
      type: String,
      trim: true,
      maxlength: 150,
    },

    details: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    occurredAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

securityLogSchema.index({ occurredAt: -1, _id: -1 });
securityLogSchema.index({ tenantId: 1, occurredAt: -1 });
securityLogSchema.index({ actor: 1, occurredAt: -1 });
securityLogSchema.index({ category: 1, severity: 1 });

module.exports =
  mongoose.models.SuperAdminSecurityLog ||
  mongoose.model(
    "SuperAdminSecurityLog",
    securityLogSchema,
    "superadmin_security_logs"
  );
