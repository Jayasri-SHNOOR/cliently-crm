
const express = require("express");

const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  getPlatformUsers,
  createPlatformUser
} = require("../controllers/userController");

const router = express.Router();

// Authentication required.
router.use(requireSession);

// Only Super Admin users can access these routes.
router.use(requireRole("SUPER_ADMIN"));

// GET /api/super-admin/users
router.get("/", getPlatformUsers);

// POST /api/super-admin/users
router.post("/", createPlatformUser);

module.exports = router;
