const mongoose = require('mongoose')
const Payment = require('../../../models/Payment')
const Invoice = require('../../../models/Invoice')
const Customer = require('../../../models/Customer')
const ServiceRequest = require('../../../models/ServiceRequest')
const { MONTHS, toId } = require('../helpers')

const PAYMENT_LABELS = { Success: 'Received', Pending: 'Pending', Failed: 'Failed' }

function invoiceStatus(inv, now) {
  if (inv.status === 'Paid' || inv.status === 'Cancelled') return inv.status
  if (inv.dueDate && new Date(inv.dueDate) < now) return 'Overdue'
  return inv.status
}

async function customerNames(tenantId, ids) {
  const valid = [...new Set(ids.map(String))].filter((id) => mongoose.isValidObjectId(id))
  if (!valid.length) return {}
  const rows = await Customer.find({ tenantId, _id: { $in: valid } }).select('name customerCode').lean()
  return Object.fromEntries(rows.map((c) => [String(c._id), c]))
}

async function getFinance(req, res, next) {
  try {
    const { tenantId } = req.user
    const tid = toId(tenantId)
    const now = new Date()
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

    const [payments, invoices, unpaidCharges, collectedByMonth] = await Promise.all([
      Payment.find({ tenantId }).sort({ createdAt: -1 }).limit(300).lean(),
      Invoice.find({ tenantId }).sort({ issuedAt: -1 }).limit(300).lean(),
      ServiceRequest.find({ tenantId, charge: { $gt: 0 }, paymentStatus: 'Unpaid', status: { $ne: 'Cancelled' } })
        .sort({ createdAt: 1 })
        .lean(),
      Payment.aggregate([
        { $match: { tenantId: tid, status: 'Success', paidAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { y: { $year: '$paidAt' }, m: { $month: '$paidAt' } }, value: { $sum: '$amount' } } }
      ])
    ])

    const names = await customerNames(tenantId, [
      ...payments.map((p) => p.customerRef || p.customerId),
      ...invoices.map((i) => i.customerId),
      ...unpaidCharges.map((r) => r.customerId)
    ])
    const nameOf = (id) => names[String(id)]?.name || '—'

    const paymentRows = payments.map((p) => ({
      id: p._id,
      ref: p.paymentId || p.orderId,
      customer: nameOf(p.customerRef || p.customerId),
      purpose: p.serviceRequestId ? 'Service charge' : 'Sale',
      date: p.paidAt || p.createdAt,
      mode: p.paymentMethod || 'Razorpay',
      amount: p.amount,
      status: PAYMENT_LABELS[p.status] || p.status
    }))

    const invoiceRows = invoices.map((inv) => ({
      id: inv._id,
      number: `INV-${String(inv.number).padStart(4, '0')}`,
      customer: nameOf(inv.customerId),
      type: inv.type,
      date: inv.issuedAt,
      due: inv.dueDate,
      amount: inv.total,
      paid: inv.amountPaid,
      balance: Math.max(0, (inv.total || 0) - (inv.amountPaid || 0)),
      status: invoiceStatus(inv, now)
    }))

    const outstanding = [
      ...invoiceRows
        .filter((i) => i.balance > 0 && i.status !== 'Cancelled')
        .map((i) => ({ id: `inv-${i.id}`, customer: i.customer, reference: i.number, kind: 'Invoice', due: i.due, balance: i.balance, status: i.status === 'Overdue' ? 'Overdue' : 'Pending' })),
      ...unpaidCharges.map((r) => ({
        id: `sr-${r._id}`,
        customer: nameOf(r.customerId),
        reference: r.requestNumber,
        kind: 'Service charge',
        due: null,
        balance: r.charge,
        status: 'Pending'
      }))
    ]

    const collected = paymentRows.filter((p) => p.status === 'Received').reduce((s, p) => s + p.amount, 0)
    const pending = outstanding.reduce((s, o) => s + o.balance, 0)
    const overdue = outstanding.filter((o) => o.status === 'Overdue').reduce((s, o) => s + o.balance, 0)

    const monthlyCollections = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const hit = collectedByMonth.find((r) => r._id.y === d.getFullYear() && r._id.m === d.getMonth() + 1)
      return { label: MONTHS[d.getMonth()], value: Number(((hit?.value ?? 0) / 100000).toFixed(2)) }
    })

    res.json({
      summary: {
        collected,
        pending,
        overdue,
        invoiced: invoiceRows.filter((i) => i.status !== 'Cancelled').reduce((s, i) => s + (i.amount || 0), 0),
        customersWithDues: new Set(outstanding.map((o) => o.customer)).size
      },
      monthlyCollections,
      invoices: invoiceRows,
      payments: paymentRows,
      outstanding
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getFinance }
