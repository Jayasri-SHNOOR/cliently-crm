const Employee = require('../../../models/Employee')
const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const { SALES_ROLE, CLOSED, toId } = require('../helpers')

async function listTeam(req, res, next) {
  try {
    const { tenantId } = req.user
    const tid = toId(tenantId)

    const [employees, leadRows, dealRows] = await Promise.all([
      Employee.find({ tenantId, role: SALES_ROLE }).sort({ name: 1 }).lean(),
      Lead.aggregate([
        { $match: { tenantId: tid, executive: { $nin: [null, ''] } } },
        { $group: { _id: { name: '$executive', status: '$status' }, count: { $sum: 1 } } }
      ]),
      Deal.aggregate([
        { $match: { tenantId: tid, assignedTo: { $nin: [null, ''] } } },
        { $group: { _id: { name: '$assignedTo', status: '$status' }, count: { $sum: 1 }, value: { $sum: '$value' } } }
      ])
    ])

    const stats = {}
    const slot = (name) =>
      (stats[name] ||= { assignedLeads: 0, activeLeads: 0, wonLeads: 0, openDeals: 0, wonDeals: 0, lostDeals: 0, wonValue: 0 })

    for (const r of leadRows) {
      const s = slot(r._id.name)
      s.assignedLeads += r.count
      if (!CLOSED.includes(r._id.status)) s.activeLeads += r.count
      if (r._id.status === 'Won') s.wonLeads += r.count
    }
    for (const r of dealRows) {
      const s = slot(r._id.name)
      if (r._id.status === 'Won') { s.wonDeals += r.count; s.wonValue += r.value }
      else if (r._id.status === 'Lost') s.lostDeals += r.count
      else s.openDeals += r.count
    }

    const team = employees.map((e) => {
      const s = stats[e.name] || slot(e.name)
      return {
        id: e._id,
        name: e.name,
        email: e.email,
        phone: e.phone,
        status: e.status,
        ...s,
        conversionRate: s.assignedLeads ? Math.round((s.wonLeads / s.assignedLeads) * 100) : 0
      }
    })

    res.json({ count: team.length, team })
  } catch (err) {
    next(err)
  }
}

module.exports = { listTeam }