const express = require("express");
const router = express.Router();

const {
  getIntegrations,
  getIntegrationById,
  updateIntegration,
} = require("../controllers/integrationController");

router.get("/", getIntegrations);
router.get("/:id", getIntegrationById);
router.patch("/:id", updateIntegration);

module.exports = router;
