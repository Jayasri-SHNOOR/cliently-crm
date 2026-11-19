
const { randomUUID } = require("crypto");
const SecurityLog = require("../securityLogModel");

const ALLOWED_CATEGORIES = [
  "Authentication",
  "Authorization",
  "Data Access",
  "Configuration",
  "System",
  "General",
];

const ALLOWED_SEVERITIES = [
  "Low",
  "Medium",
  "High",
  "Critical",
];

async function recordAuditEvent({
  req,
  event,
  action,
  category = "General",
  severity = "Low",
  resourceType,
  resourceId,
  tenantId,
  details = "",
  session = null,
}) {
  if (!req?.user?.id) {
    throw new Error(
      "Cannot record audit event without authenticated user"
    );
  }

  if (
    typeof event !== "string" ||
    !event.trim() ||
    event.length > 500
  ) {
    throw new Error("Invalid audit event");
  }

  if (
    typeof action !== "string" ||
    !/^[a-z][a-z0-9_.-]{0,149}$/.test(action)
  ) {
    throw new Error("Invalid audit action");
  }

  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error("Invalid audit category");
  }

  if (!ALLOWED_SEVERITIES.includes(severity)) {
    throw new Error("Invalid audit severity");
  }

  const actor =
    req.user.email ||
    req.user.name ||
    String(req.user.id);

  const auditEvent = {
    eventId: randomUUID(),
    event: event.trim(),
    action,
    category,
    severity,
    actor: String(actor).slice(0, 150),
    actorId: String(req.user.id),
    tenantId: tenantId
      ? String(tenantId)
      : undefined,
    resourceType,
    resourceId: resourceId
      ? String(resourceId)
      : undefined,
    correlationId: randomUUID(),
    details: String(details).slice(0, 2000),
    occurredAt: new Date(),
  };

  const documents = await SecurityLog.create(
    [auditEvent],
    session ? { session } : {}
  );

  return documents[0];
}

module.exports = {
  recordAuditEvent,
};
