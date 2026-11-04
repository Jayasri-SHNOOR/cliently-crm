
const mongoose = require("mongoose");
const User = require("../../../models/User");
const Employee = require("../../../models/Employee");

const getProfile = async (req, res) => {
  try {
    // Temporarily fetch the first user until login
    // identifies the currently logged-in user.
    const user = await User.findOne()
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let employee = null;

    if (mongoose.isValidObjectId(user._id)) {
      employee = await Employee.findOne({
        userId: user._id,
      }).lean();
    }

    res.status(200).json({
      success: true,
      data: {
        ...user,
        designation: employee?.designation || "",
        department: employee?.department || "",
        joiningDate: employee?.joiningDate || null,
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
