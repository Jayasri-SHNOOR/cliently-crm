const User = require("../../../models/User");
const Employee = require("../../../models/Employee");

const getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.user.id,
      tenantId: req.user.tenantId,
    })
      .select("name email mobileNumber role status tenantId employeeId lastLoginAt createdAt")
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const employee = user.employeeId
      ? await Employee.findOne({ _id: user.employeeId, tenantId: req.user.tenantId })
          .select("role department phone createdAt")
          .lean()
      : null;

    res.status(200).json({
      success: true,
      data: {
        ...user,
        company: req.user.company || null,
        designation: employee?.role || "",
        department: employee?.department || "",
        phone: employee?.phone || user.mobileNumber || "",
        joiningDate: employee?.createdAt || null,
      },
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
    });
  }
};

module.exports = { getProfile };