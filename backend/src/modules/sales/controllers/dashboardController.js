
const Task = require("../models/task");
const mongoose = require("mongoose");

// GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    console.log("Connected database:", mongoose.connection.name);

    const [
      totalCustomers,
      totalTasks,
      pendingTasks,
      completedTasks,
      inProgressTasks,
    ] = await Promise.all([
      mongoose.connection.db
        .collection("customers")
        .countDocuments(),

      Task.countDocuments(),
      Task.countDocuments({ status: "Pending" }),
      Task.countDocuments({ status: "Completed" }),
      Task.countDocuments({ status: "In Progress" }),
    ]);

    console.log("Customers found:", totalCustomers);

    res.status(200).json({
      success: true,
      message: "Dashboard statistics fetched successfully",
      stats: {
        totalCustomers,
        totalTasks,
        pendingTasks,
        completedTasks,
        inProgressTasks,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.stack || error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = { getDashboard };
