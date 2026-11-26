const Deal = require('../../../models/Deal')
const { CLOSED_STATUSES } = Deal
const escapeRegex = require('../../../utils/escapeRegex')
const { toId } = require('../helpers')

const STALL_DAYS = 14

function formatDeal(d) {
  const stalled =
    !CLOSED_STATUSES.includes(d.status) &&
    Date.now() - new Date(d.updatedAt).getTime() > STALL_DAYS * 24 * 60 * 60 * 1000
  return {
    id: d._id,
    name: d.name,
    customer: d.customer,
    product: d.product,
    value: d.value,
    status: d.status,
    assignedTo: d.assignedTo,
    expectedClose: d.expectedClose,
    stalled,
    updatedAt: d.updatedAt
  }
}

async function listDeals(req, res, next) {
  try {
    const { tenantId } = req.user
    const { status, assignedTo, search } = req.query
    const filter = { tenantId }
    if (status) filter.status = status
    if (assignedTo) filter.assignedTo = assignedTo
    if (search?.trim()) {
      const p = new RegExp(escapeRegex(search.trim().slice(0, 50)), 'i')
      filter.$or = [{ name: p }, { customer: p }, { product: p }]
    }

    const [deals, rows] = await Promise.all([
      Deal.find(filter).sort({ expectedClose: 1 }).lean(),
      Deal.aggregate([
        { $match: { tenantId: toId(tenantId) } },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$value' } } }
      ])
    ])

    const summary = { total: 0, open: 0, won: 0, lost: 0, openValue: 0, wonValue: 0 }
    for (const r of rows) {
      summary.total += r.count
      if (r._id === 'Won') { summary.won = r.count; summary.wonValue = r.value }
      else if (r._id === 'Lost') summary.lost = r.count
      else { summary.open += r.count; summary.openValue += r.value }
    }

    res.json({ summary, count: deals.length, deals: deals.map(formatDeal) })
  } catch (err) {
    next(err)
  }
}

module.exports = { listDeals }