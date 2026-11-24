const express = require("express");
const router = express.Router();
const { issueLink } = require("../controllers/portalAccessController");

router.post("/:customerId", issueLink);

module.exports = router;