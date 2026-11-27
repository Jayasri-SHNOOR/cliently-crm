const express = require("express");
const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  getProfile,
  updateProfile
} = require("../controllers/profileController");

const router = express.Router();

router.use(requireSession);
router.use(requireRole("SUPER_ADMIN"));

router.get("/", getProfile);
router.patch("/", updateProfile);

const {
  listOwnSessions,
  revokeOwnSession
} = require("../controllers/profileController");

router.get("/sessions", listOwnSessions);
router.delete("/sessions/:id", revokeOwnSession);

const {
  listOwnActivity
} = require("../controllers/profileController");

router.get("/activity", listOwnActivity);

module.exports = router;