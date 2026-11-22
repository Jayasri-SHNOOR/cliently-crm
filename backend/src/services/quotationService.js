const Quotation = require('../models/Quotation')
const nextSequence = require('../utils/nextSequence')

async function createQuotation({ tenantId, deal, items, validUntil, executive }) {
  const seq = await nextSequence(`quotation:${tenantId}`)
  return Quotation.create({
    tenantId,
    number: `QT-${String(seq).padStart(4, '0')}`,
    dealId: deal._id,
    customer: deal.customer,
    items,
    validUntil,
    executive: executive || deal.assignedTo
  })
}

module.exports = { createQuotation }