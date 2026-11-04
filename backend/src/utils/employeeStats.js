const mongoose = require('mongoose')
const Lead = require('../models/Lead')
const Deal = require('../models/Deal')
const Activity = require('../modules/sales/models/activity')
const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '')

const nameKey = (field) => ({
  $toLower: {
    $replaceAll: {
      input: { $trim: { input: { $ifNull: [field, ''] } } },
      find: ' ',
      replacement: ''
    }
  }
})

const count = (cond) => ({ $sum: { $cond: [cond, 1, 0] } })
const money = (cond) => ({ $sum: { $cond: [cond, '$value', 0] } })

async function attachEmployeeStats(employees, tenantId) {
  if (!employees.length) return employees

  const tid = new mongoose.Types.ObjectId(tenantId)
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const quarterStart = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
  )
  const isWon = { $eq: ['$status', 'Won'] }
  const employeeIds = employees.map((e) => e._id)

  const [leadRows, dealRows, activityRows] = await Promise.all([
    Lead.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: nameKey('$executive'),
          leadsAssigned: { $sum: 1 },
          qualified: count({ $eq: ['$status', 'Qualified'] })
        }
      }
    ]),

    Deal.aggregate([
      { $match: { tenantId: tid } },
      {
        $group: {
          _id: nameKey('$assignedTo'),
          deals: { $sum: 1 },
          won: count(isWon),
          lost: count({ $eq: ['$status', 'Lost'] }),
          inProgress: count({
            $not: [{ $in: ['$status', ['Won', 'Lost']] }]
          }),
          revenue: money(isWon),
          revenueMonth: money({
            $and: [isWon, { $gte: ['$updatedAt', monthStart] }]
          }),
          revenueQuarter: money({
            $and: [isWon, { $gte: ['$updatedAt', quarterStart] }]
          })
        }
      }
    ]),

    // Activities have no tenantId, so scope them by this tenant's employee ids
    Activity.aggregate([
      { $match: { employeeId: { $in: employeeIds } } },
      {
        $group: {
          _id: {
            emp: '$employeeId',
            type: { $toLower: { $trim: { input: '$activityType' } } }
          },
          n: { $sum: 1 }
        }
      }
    ])
  ])

  const leadsBy = new Map(leadRows.map((r) => [r._id, r]))
  const dealsBy = new Map(dealRows.map((r) => [r._id, r]))

  const activitiesBy = new Map()
  for (const row of activityRows) {
    const id = String(row._id.emp)
    const a = activitiesBy.get(id) || {
      calls: 0,
      meetings: 0,
      demos: 0,
      followUps: 0
    }
    const type = row._id.type || ''

    if (type.includes('call')) a.calls += row.n
    else if (type.includes('meeting')) a.meetings += row.n
    else if (type.includes('demo')) a.demos += row.n
    else if (type.includes('follow')) a.followUps += row.n

    activitiesBy.set(id, a)
  }

  return employees.map((emp) => {
    const key = norm(emp.name)
    const l = leadsBy.get(key) || {}
    const d = dealsBy.get(key) || {}
    const a = activitiesBy.get(String(emp._id)) || {}

    return {
      ...emp,
      leadsAssigned: l.leadsAssigned || 0,
      qualified: l.qualified || 0,
      deals: d.deals || 0,
      won: d.won || 0,
      lost: d.lost || 0,
      inProgress: d.inProgress || 0,
      activeDeals: d.inProgress || 0,
      revenue: d.revenue || 0,
      revenueMonth: d.revenueMonth || 0,
      revenueQuarter: d.revenueQuarter || 0,
      calls: a.calls || 0,
      meetings: a.meetings || 0,
      demos: a.demos || 0,
      followUps: a.followUps || 0
    }
  })
}

module.exports = { attachEmployeeStats }