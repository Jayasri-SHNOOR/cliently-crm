
const Tenant = require("../tenantModel");
const Subscription = require("../subscriptionModel");

async function getUsageOverview(req, res, next) {
  try {
    const [
      totalTenants,
      activeTenants,
      pendingTenants,
      blockedTenants,
      tenantPlans,
      subscriptionStatuses,
      billingCycles,
    ] = await Promise.all([
      Tenant.countDocuments(),
      Tenant.countDocuments({ status: "Active" }),
      Tenant.countDocuments({ status: "Pending" }),
      Tenant.countDocuments({ status: "Blocked" }),

      Tenant.aggregate([
        {
          $group: {
            _id: "$plan",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Subscription.aggregate([
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Subscription.aggregate([
        {
          $group: {
            _id: "$billingCycle",
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        tenants: {
          total: totalTenants,
          active: activeTenants,
          pending: pendingTenants,
          blocked: blockedTenants,
        },
        plans: tenantPlans.map((item) => ({
          name: item._id || "Unknown",
          count: item.count,
        })),
        subscriptions: {
          statuses: subscriptionStatuses.map((item) => ({
            name: item._id || "Unknown",
            count: item.count,
          })),
          billingCycles: billingCycles.map((item) => ({
            name: item._id || "Unknown",
            count: item.count,
          })),
        },
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getTenantUsage(req, res, next) {
  try {
    const tenants = await Tenant.find(
      {},
      "company admin email plan environment status createdAt"
    )
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getUsageOverview,
  getTenantUsage,
};
