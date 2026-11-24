
const express = require("express");
const router = express.Router();

const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  getUsageOverview,
  getTenantUsage,
} = require("../controllers/usageController");

router.use(requireSession);
router.use(requireRole("SUPER_ADMIN"));

router.get("/overview", getUsageOverview);
router.get("/tenants", getTenantUsage);

module.exports = router;