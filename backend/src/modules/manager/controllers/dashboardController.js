const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const { CLOSED_STATUSES } = Deal
const { UNASSIGNED, CLOSED, MONTHS, toId, formatLead } = require('../helpers')

async function getDashboard(req, res, next) {
  try {
    const tenantId = toId(req.user.tenantId)
    const now = new Date()
    const open = { status: { $nin: CLOSED } }
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [
      totalLeads, unassignedLeads, pendingFollowups, overdueCount,
      dealsByStatus, wonByMonth, recentUnassigned, overdueLeads
    ] = await Promise.all([
      Lead.countDocuments({ tenantId }),
      Lead.countDocuments({ tenantId, ...UNASSIGNED }),
      Lead.countDocuments({ tenantId, ...open, nextFollowUp: { $ne: null } }),
      Lead.countDocuments({ tenantId, ...open, nextFollowUp: { $lt: now } }),
      Deal.aggregate([
        { $match: { tenantId } },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } }
      ]),
      Deal.aggregate([
        { $match: { tenantId, status: 'Won', updatedAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } }, value: { $sum: '$value' } } }
      ]),
      Lead.find({ tenantId, ...UNASSIGNED }).sort({ createdAt: -1 }).limit(5).lean(),
      Lead.find({ tenantId, ...open, nextFollowUp: { $lt: now } }).sort({ nextFollowUp: 1 }).limit(5).lean()
    ])

    const byStatus = Object.fromEntries(dealsByStatus.map((d) => [d._id, d]))
    const activeDeals = dealsByStatus
      .filter((d) => !CLOSED_STATUSES.includes(d._id))
      .reduce((sum, d) => sum + d.count, 0)

    const monthlySales = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const hit = wonByMonth.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1)
      return { label: MONTHS[d.getMonth()], value: Number(((hit?.value ?? 0) / 100000).toFixed(1)) }
    })

    res.json({
      stats: {
        totalLeads,
        assignedLeads: totalLeads - unassignedLeads,
        unassignedLeads,
        pendingFollowups,
        overdueFollowups: overdueCount,
        activeDeals,
        wonDeals: byStatus.Won?.count ?? 0,
        lostDeals: byStatus.Lost?.count ?? 0,
        wonValue: byStatus.Won?.value ?? 0
      },
      monthlySales,
      needsAttention: {
        unassigned: recentUnassigned.map(formatLead),
        overdue: overdueLeads.map(formatLead)
      }
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboard }