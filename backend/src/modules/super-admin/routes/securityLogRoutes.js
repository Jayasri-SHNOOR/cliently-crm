const express = require("express");
const router = express.Router();

const {
  getSecurityLogs,
  getSecurityLogById,
  createSecurityLog,
} = require("../controllers/securityLogController");

router.get("/", getSecurityLogs);

router.get("/:id", getSecurityLogById);

router.post("/", createSecurityLog);

module.exports = router;
