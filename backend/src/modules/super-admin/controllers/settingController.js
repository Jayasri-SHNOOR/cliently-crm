
const Settings = require("../../../models/settingModel");

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: "platform" },
      { $setOnInsert: { key: "platform" } },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Get Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateSettings = async (req, res) => {
  try {
    const allowedFields = [
      "organization",
      "regional",
      "notifications",
      "businessHours",
      "security",
      "dataSharing",
      "customization",
      "integrations",
    ];

    const updates = {};

    for (const section of allowedFields) {
      const values = req.body?.[section];

      if (values === undefined) continue;

      if (!values || typeof values !== "object" || Array.isArray(values)) {
        return res.status(400).json({
          success: false,
          message: `Invalid section: ${section}`,
        });
      }

      for (const [field, value] of Object.entries(values)) {
        updates[`${section}.${field}`] = value;
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No settings provided",
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: "platform" },
      {
        $set: updates,
        $setOnInsert: { key: "platform" },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Settings updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Update Settings Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
};
