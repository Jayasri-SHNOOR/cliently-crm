const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const { LEAD_STATUSES } = Lead
const { MONTHS, toId } = require('../helpers')

async function getReports(req, res, next) {
  try {
    const tenantId = toId(req.user.tenantId)
    const now = new Date()
    const months = Math.min(Math.max(parseInt(req.query.months) || 6, 1), 12)
    const since = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1)

    const [wonByMonth, byExecutive, leadsByStatus, leadsBySource, dealTotals] = await Promise.all([
      Deal.aggregate([
        { $match: { tenantId, status: 'Won', updatedAt: { $gte: since } } },
        {
          $group: {
            _id: { y: { $year: '$updatedAt' }, m: { $month: '$updatedAt' } },
            value: { $sum: '$value' },
            count: { $sum: 1 }
          }
        }
      ]),
      Deal.aggregate([
        { $match: { tenantId, assignedTo: { $nin: [null, ''] } } },
        { $group: { _id: { name: '$assignedTo', status: '$status' }, count: { $sum: 1 }, value: { $sum: '$value' } } }
      ]),
      Lead.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      Lead.aggregate([{ $match: { tenantId } }, { $group: { _id: '$source', count: { $sum: 1 } } }]),
      Deal.aggregate([{ $match: { tenantId } }, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } }])
    ])
    const monthlySales = Array.from({ length: months }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (months - 1) + i, 1)
      const hit = wonByMonth.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1)
      return {
        label: MONTHS[d.getMonth()],
        value: Number(((hit?.value ?? 0) / 100000).toFixed(1)),
        count: hit?.count ?? 0
      }
    })

    const exec = {}
    for (const r of byExecutive) {
      const e = (exec[r._id.name] ||= { name: r._id.name, won: 0, lost: 0, open: 0, wonValue: 0 })
      if (r._id.status === 'Won') { e.won += r.count; e.wonValue += r.value }
      else if (r._id.status === 'Lost') e.lost += r.count
      else e.open += r.count
    }

    const leadMap = Object.fromEntries(leadsByStatus.map((r) => [r._id, r.count]))
    const dealMap = Object.fromEntries(dealTotals.map((r) => [r._id, r]))
    const won = dealMap.Won?.count ?? 0
    const lost = dealMap.Lost?.count ?? 0

    res.json({
      totals: {
        totalLeads: leadsByStatus.reduce((s, r) => s + r.count, 0),
        wonValue: dealMap.Won?.value ?? 0,
        wonDeals: won,
        winRate: won + lost ? Math.round((won / (won + lost)) * 100) : 0,
        avgDealValue: won ? Math.round((dealMap.Won?.value ?? 0) / won) : 0
      },
      monthlySales,
      dealsByExecutive: Object.values(exec).sort((a, b) => b.wonValue - a.wonValue),
      leadFunnel: LEAD_STATUSES.map((status) => ({ status, count: leadMap[status] ?? 0 })),
      leadSources: leadsBySource.map((r) => ({ source: r._id || 'Unknown', count: r.count }))
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getReports }