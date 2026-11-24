const mongoose = require("mongoose");
const Customer = require("../../../models/Customer");
const { issuePortalAccess } = require("../../../utils/customerAccess");

const issueLink = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const employeeId = req.user?.employeeId;

    if (!tenantId || !employeeId) {
      return res.status(403).json({
        success: false,
        message: "Your login is not linked to an employee record. Please contact your admin.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.customerId)) {
      return res.status(400).json({ success: false, message: "Invalid customer ID" });
    }

    const customer = await Customer.findOne({
      _id: req.params.customerId,
      tenantId,
      ownerId: employeeId,
    }).lean();

    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    const portal = await issuePortalAccess({
      tenantId,
      customerId: customer._id,
      issuedBy: req.user.id,
    });

    res.status(200).json({
      success: true,
      message: "New portal link created. It works for 48 hours.",
      portal,
    });
  } catch (error) {
    console.error("Portal link error:", error.message);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Could not create the portal link",
    });
  }
};

module.exports = { issueLink };