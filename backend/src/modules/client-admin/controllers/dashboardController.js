const mongoose = require('mongoose')
const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const { CLOSED_STATUSES } = require('../../../models/Deal')
const { getOperationsSummary } = require('../../operations/controllers/dashboardController')

function toObjectId(id) {
  return new mongoose.Types.ObjectId(String(id))
}

async function safeOperationsSummary(tenantId) {
  try {
    return await getOperationsSummary(tenantId)
  } catch (err) {
    console.error('Operations summary failed:', err.message)
    return null
  }
}

async function getDashboard(req, res, next) {
  try {
    const { tenantId } = req.user
    const tenantObjectId = toObjectId(tenantId)

    const [totalLeads, qualifiedLeads, openDeals, revenueResult, recent, statusCounts, operations] =
      await Promise.all([
        Lead.countDocuments({ tenantId }),
        Lead.countDocuments({ tenantId, status: 'Qualified' }),
        Deal.countDocuments({ tenantId, status: { $nin: CLOSED_STATUSES } }),
        Deal.aggregate([
          { $match: { tenantId: tenantObjectId, status: 'Won' } },
          { $group: { _id: null, total: { $sum: '$value' } } }
        ]),
        Lead.find({ tenantId })
          .sort({ createdAt: -1 })
          .limit(8)
          .select('name email status value')
          .lean(),
        Lead.aggregate([
          { $match: { tenantId: tenantObjectId } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ]),
        safeOperationsSummary(tenantObjectId)
      ])

    const leadsByStatus = { New: 0, Contacted: 0, Qualified: 0, Proposal: 0 }
    statusCounts.forEach(({ _id, count }) => {
      leadsByStatus[_id] = count
    })

    res.json({
      admin: { name: req.user.name },
      stats: {
        totalLeads,
        qualifiedLeads,
        openDeals,
        totalRevenue: revenueResult[0]?.total || 0
      },
      recentLeads: recent.map((lead) => ({
        id: lead._id,
        name: lead.name,
        email: lead.email,
        status: lead.status,
        value: lead.value
      })),
      leadsByStatus,
      operations
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getDashboard }