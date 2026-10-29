
const express = require("express");
const router = express.Router();

const {
  getSystemHealth,
} = require("../controllers/systemHealthController");

router.get("/", getSystemHealth);

module.exports = router;
