const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const { CLOSED_STATUSES } = require('../../../models/Deal')

async function getDashboard(req, res, next) {
  try{
    const { tenantId } = req.user
    const [totalLeads, qualifiedLeads, openDeals, revenueResult, recent, statusCounts] =
      await Promise.all([
        Lead.countDocuments({ tenantId }),
        Lead.countDocuments({ 
            tenantId, status: 'Qualified' 
        }),
        Deal.countDocuments({ 
            tenantId, status: { $nin: CLOSED_STATUSES } 
        }),
        Deal.aggregate([
          { $match: { tenantId, status: 'Won' } },
          { $group: { _id: null, total: { $sum: '$value' } } }
        ]),
        Lead.find({ tenantId })
          .sort({ createdAt: -1 })
          .limit(8)
          .select('name email status value')
          .lean(),
        Lead.aggregate([
          { $match: { tenantId } },
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
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
      leadsByStatus
    })
  }catch(err) {
    next(err) 
  }
}

module.exports = {getDashboard}