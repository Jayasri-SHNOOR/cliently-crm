
const express = require("express");
const router = express.Router();

const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  getSecurityLogs,
  getSecurityLogById,
} = require("../controllers/securityLogController");

// Validate the CLIENTLY session first.
router.use(requireSession);

// Allow only authenticated Super Admin users.
router.use(requireRole("SUPER_ADMIN"));

// Read-only audit history endpoints.
router.get("/", getSecurityLogs);
router.get("/:id", getSecurityLogById);

module.exports = router;
