const express = require("express");
const router = express.Router();

const requireAuth = require("../../../middleware/requireAuth");
const requireRole = require("../../../middleware/requireRole");
const { getSettings, updateSettings } = require("../controllers/settingController");

router.use(requireAuth, requireRole("SUPER_ADMIN"));

router.get("/", getSettings);
router.patch("/", updateSettings);

module.exports = router;