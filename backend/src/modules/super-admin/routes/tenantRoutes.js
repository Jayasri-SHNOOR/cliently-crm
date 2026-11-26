
const express = require("express");
const router = express.Router();

const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} = require("../controllers/tenantController");

// Authentication and authorization
router.use(requireSession);
router.use(requireRole("SUPER_ADMIN"));

// Get all tenants
router.get("/", getTenants);

// Get one tenant
router.get("/:id", getTenantById);

// Create tenant
router.post("/", createTenant);

// Update tenant
router.patch("/:id", updateTenant);

// Delete tenant
router.delete("/:id", deleteTenant);

module.exports = router;
