const Settings = require("../../../models/settingModel");

const EDITABLE_FIELDS = {
  organization: ["companyName", "supportEmail"],
  regional: ["timezone", "language", "locale", "dateFormat", "timeFormat", "currency", "weekStartsOn"],
  notifications: ["emailEnabled", "systemAlertsEnabled"],
  businessHours: ["enabled", "startTime", "endTime", "workingDays"],
  security: [
    "twoFactorRequired",
    "sessionTimeoutMinutes",
    "passwordMinLength",
    "requireUppercase",
    "requireNumber",
    "requireSpecialCharacter",
  ],
  dataSharing: ["allowDataExport", "allowExternalSharing"],
  customization: ["defaultPipeline", "defaultView"],
  integrations: ["apiAccessEnabled", "webhooksEnabled"],
};

const handleError = (res, error) => {
  console.error("Settings error:", error); // full details stay on the server

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ success: false, message: error.message });
  }
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
  });
};

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: "platform" },
      { $setOnInsert: { key: "platform" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    handleError(res, error);
  }
};

const updateSettings = async (req, res) => {
  try {
    const updates = {};

    for (const [section, fields] of Object.entries(EDITABLE_FIELDS)) {
      const values = req.body?.[section];
      if (values === undefined) continue;

      if (values === null || typeof values !== "object" || Array.isArray(values)) {
        return res.status(400).json({
          success: false,
          message: `Invalid settings section: ${section}`,
        });
      }

      for (const [field, value] of Object.entries(values)) {
        if (!fields.includes(field)) {
          return res.status(400).json({
            success: false,
            message: `Unknown setting: ${section}.${field}`,
          });
        }
        updates[`${section}.${field}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "No valid settings provided." });
    }

    // Cross-field rule: Mongoose can't check this for us on updates.
    const bh = req.body.businessHours;
    if (bh?.startTime && bh?.endTime && bh.startTime >= bh.endTime) {
      return res.status(400).json({
        success: false,
        message: "Closing time must be after opening time.",
      });
    }

    // requireAuth puts the logged-in user on req.user (the id is a MongoDB _id)
    updates.updatedBy = req.user.id;

    const settings = await Settings.findOneAndUpdate(
      { key: "platform" },
      { $set: updates },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    handleError(res, error);
  }
};

module.exports = { getSettings, updateSettings };