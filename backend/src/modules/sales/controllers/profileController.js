const User = require("../../../models/User");
const Employee = require("../../../models/Employee");

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

async function buildProfile(req) {
  const user = await User.findOne({ _id: req.user.id, tenantId: req.user.tenantId })
    .select("name email mobileNumber role status tenantId employeeId lastLoginAt createdAt")
    .lean();

  if (!user) return null;

  const employee = user.employeeId
    ? await Employee.findOne({ _id: user.employeeId, tenantId: req.user.tenantId })
        .select("role department phone createdAt")
        .lean()
    : null;

  return {
    ...user,
    company: req.user.company || null,
    designation: employee?.role || "",
    department: employee?.department || "",
    phone: employee?.phone || user.mobileNumber || "",
    joiningDate: employee?.createdAt || null,
  };
}

const getProfile = async (req, res) => {
  try {
    const profile = await buildProfile(req);

    if (!profile) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, data: profile });
  } catch (error) {
    console.error("Profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch profile" });
  }
};

const updateProfile = async (req, res) => {
  try {
    const body = req.body || {};
    const updates = {};

    if (body.name !== undefined) {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (name.length < 2 || name.length > 80) {
        return res.status(400).json({ success: false, message: "Name must be 2 to 80 characters" });
      }
      updates.name = name;
    }

    if (body.phone !== undefined) {
      const phone = typeof body.phone === "string" ? body.phone.trim() : "";
      if (phone && !PHONE_PATTERN.test(phone)) {
        return res.status(400).json({ success: false, message: "Enter a valid phone number" });
      }
      updates.phone = phone;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: "Nothing to update" });
    }

    const userSet = {};
    if (updates.name !== undefined) userSet.name = updates.name;
    if (updates.phone !== undefined) userSet.mobileNumber = updates.phone;

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, tenantId: req.user.tenantId },
      { $set: userSet },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.employeeId) {
      await Employee.updateOne({ _id: user.employeeId, tenantId: req.user.tenantId }, { $set: updates });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated",
      data: await buildProfile(req),
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

module.exports = { getProfile, updateProfile };
