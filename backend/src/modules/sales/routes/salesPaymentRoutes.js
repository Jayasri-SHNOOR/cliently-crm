const express = require("express");
const { listPayments } = require("../controllers/salesPaymentController");

const router = express.Router();

router.get("/", listPayments);

module.exports = router;
