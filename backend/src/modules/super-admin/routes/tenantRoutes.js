const express = require("express");
const router = express.Router();

const {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} = require("../controllers/tenantController");
router.get("/", getTenants);
router.get("/:id", getTenantById);
router.post("/", createTenant);
router.patch("/:id", updateTenant);
router.delete("/:id", deleteTenant);

module.exports = router;
