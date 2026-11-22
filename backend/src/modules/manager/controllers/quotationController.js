const Quotation = require('../../../models/Quotation')
const escapeRegex = require('../../../utils/escapeRegex')
function displayStatus(q) {
  if (q.status === 'Sent' && q.validUntil && new Date(q.validUntil) < new Date()) return 'Expired'
  return q.status
}

function formatQuotation(q) {
  return {
    id: q._id,
    number: q.number,
    customer: q.customer,
    amount: q.amount,
    status: displayStatus(q),
    executive: q.executive,
    validUntil: q.validUntil,
    createdAt: q.createdAt,
    itemCount: q.items.length
  }
}

async function listQuotations(req, res, next) {
  try {
    const { tenantId } = req.user
    const { executive, search } = req.query
    const filter = { tenantId }
    if (executive) filter.executive = executive
    if (search?.trim()) {
      const p = new RegExp(escapeRegex(search.trim().slice(0, 50)), 'i')
      filter.$or = [{ number: p }, { customer: p }]
    }

    const rows = (await Quotation.find(filter).sort({ createdAt: -1 }).limit(500).lean()).map(formatQuotation)

    const sum = (list) => list.reduce((s, q) => s + q.amount, 0)
    const of = (status) => rows.filter((q) => q.status === status)

    res.json({
      summary: {
        total: rows.length,
        awaiting: of('Sent').length,
        accepted: of('Accepted').length,
        rejected: of('Rejected').length,
        expired: of('Expired').length,
        acceptedValue: sum(of('Accepted')),
        awaitingValue: sum(of('Sent'))
      },
      count: rows.length,
      quotations: rows
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { listQuotations }