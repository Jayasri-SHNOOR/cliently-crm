const Task = require("../models/task");
const Customer = require("../models/Customer");

const getDashboard = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(403).json({
        success: false,
        message: "Tenant information is missing",
      });
    }

    // Tasks belong to the logged-in user only
    const mine = { tenantId, userId };

    const [
      totalCustomers,
      totalTasks,
      pendingTasks,
      completedTasks,
      inProgressTasks,
    ] = await Promise.all([
      Customer.countDocuments({ tenantId }), // TODO: scope to this executive once Customer owner field is confirmed
      Task.countDocuments(mine),
      Task.countDocuments({ ...mine, status: "Pending" }),
      Task.countDocuments({ ...mine, status: "Completed" }),
      Task.countDocuments({ ...mine, status: "In Progress" }),
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