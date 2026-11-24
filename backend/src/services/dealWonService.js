const Deal = require('../models/Deal')
const Customer = require('../models/Customer')
const nextSequence = require('../utils/nextSequence')
const escapeRegex = require('../utils/escapeRegex')

async function findOrCreateCustomer(tenantId, name) {
  const existing = await Customer.findOne({
    tenantId,
    name: new RegExp(`^${escapeRegex(name.trim())}$`, 'i')
  })
  if (existing) return existing

  const seq = await nextSequence(`customer:${tenantId}`)
  return Customer.create({
    tenantId,
    name: name.trim(),
    customerCode: `CUST-${String(seq).padStart(4, '0')}`
  })
}
async function onDealWon(deal) {
  try {
    if (!deal || deal.status !== 'Won' || deal.customerId) return
    const customer = await findOrCreateCustomer(deal.tenantId, deal.customer)
    await Deal.updateOne({ _id: deal._id, customerId: null }, { $set: { customerId: customer._id } })
  } catch (err) {
    console.error('onDealWon failed:', err.message)
  }
}

module.exports = { onDealWon }