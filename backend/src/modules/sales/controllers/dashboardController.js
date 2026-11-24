const Task = require("../models/task");
const Customer = require("../models/Customer");

const getDashboard = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!tenantId) {
      return res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    const [
      totalCustomers,
      totalTasks,
      pendingTasks,
      completedTasks,
      inProgressTasks,
    ] = await Promise.all([
      Customer.countDocuments({ tenantId }),
      Task.countDocuments({ tenantId }),
      Task.countDocuments({ tenantId, status: "Pending" }),
      Task.countDocuments({ tenantId, status: "Completed" }),
      Task.countDocuments({ tenantId, status: "In Progress" }),
    ]);

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
    console.error("Dashboard error:", error.message);

    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
    });
  }
};

module.exports = { getDashboard };