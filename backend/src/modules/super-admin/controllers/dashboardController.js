
const Tenant = require("../tenantModel");
const Subscription = require("../subscriptionModel");

const getDashboardOverview = async (req, res) => {
  try {
    const [
      totalTenants,
      activeTenants,
      activeSubscriptions,
      monthlyRevenue,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: "Active" }),
      Subscription.countDocuments({ status: "Active" }),
      Subscription.aggregate([
        { $match: { status: "Active" } },
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $switch: {
                  branches: [
                    {
                      case: { $eq: ["$billingCycle", "Monthly"] },
                      then: "$amount",
                    },
                    {
                      case: { $eq: ["$billingCycle", "Quarterly"] },
                      then: { $divide: ["$amount", 3] },
                    },
                    {
                      case: { $eq: ["$billingCycle", "Yearly"] },
                      then: { $divide: ["$amount", 12] },
                    },
                  ],
                  default: 0,
                },
              },
            },
          },
        },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTenants,
        activeTenants,
        activeSubscriptions,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard overview error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve dashboard overview",
    });
  }
};

module.exports = { getDashboardOverview };
