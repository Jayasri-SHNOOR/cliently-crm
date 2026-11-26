const express = require("express");
const router = express.Router();

const requireSession = require("../../../middleware/requireSession");
const requireRole = require("../../../middleware/requireRole");

const {
  listTickets,
  getOverview,
  getTicket
} = require("../controllers/supportController");

router.use(requireSession);
router.use(requireRole("SUPER_ADMIN"));

router.get("/overview", getOverview);
router.get("/tickets", listTickets);
router.get("/tickets/:id", getTicket);

module.exports = router;
