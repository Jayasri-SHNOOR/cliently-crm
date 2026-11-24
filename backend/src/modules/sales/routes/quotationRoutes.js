const express = require("express");
const router = express.Router();

const {
  listQuotations,
  getQuotation,
  createQuotation,
  updateQuotation,
  sendQuotation,
  acceptQuotation,
  rejectQuotation,
  convertQuotation,
} = require("../controllers/quotationController");

router.get("/", listQuotations);
router.post("/", createQuotation);
router.get("/:id", getQuotation);
router.put("/:id", updateQuotation);
router.post("/:id/send", sendQuotation);
router.post("/:id/accept", acceptQuotation);
router.post("/:id/reject", rejectQuotation);
router.post("/:id/convert", convertQuotation);

module.exports = router;