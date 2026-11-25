const crypto = require('crypto')
const Payment = require('../models/Payment')
const Sale = require('../models/Sale')
const AppError = require('../utils/AppError')

const REUSE_PENDING_MS = 15 * 60 * 1000

function fail(message, status, code) {
  const err = new AppError(message, status, code)
  err.code = code
  return err
}

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw fail('Online payment is not available right now. Please try again later.', 503, 'PAYMENTS_DISABLED')
  }
  return require('../config/razorpay')
}

function safeEqualHex(expectedHex, givenHex) {
  if (typeof givenHex !== 'string' || !/^[a-f0-9]{64}$/i.test(givenHex)) return false
  return crypto.timingSafeEqual(Buffer.from(expectedHex, 'hex'), Buffer.from(givenHex, 'hex'))
}

function checkoutSignatureMatches(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false
  const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex')
  return safeEqualHex(expected, signature)
}

function webhookSignatureMatches(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret || !Buffer.isBuffer(rawBody)) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  return safeEqualHex(expected, signature)
}

function balanceOf(sale) {
  return Math.round((Number(sale.totalAmount || 0) - Number(sale.amountPaid || 0)) * 100) / 100
}

function isPaid(sale) {
  return ['paid', 'success', 'completed'].includes(String(sale.paymentStatus || '').toLowerCase()) || balanceOf(sale) < 1
}

async function createOrderForSale(sale, customerRef) {
  if (String(sale.saleStatus || '').toLowerCase() === 'cancelled') {
    throw fail('This order was cancelled and cannot be paid.', 400, 'ORDER_CANCELLED')
  }
  if (isPaid(sale)) throw fail('This order is already paid.', 400, 'ALREADY_PAID')

  const amount = balanceOf(sale)

  const recent = await Payment.findOne({
    tenantId: sale.tenantId,
    saleId: String(sale._id),
    customerRef,
    status: 'Pending',
    amount,
    createdAt: { $gte: new Date(Date.now() - REUSE_PENDING_MS) }
  }).sort({ createdAt: -1 })

  if (recent) return { orderId: recent.orderId, amountInPaise: Math.round(amount * 100) }

  const order = await getRazorpay().orders.create({
    amount: Math.round(amount * 100),
    currency: 'INR',
    receipt: `${sale.saleNumber || 'sale'}_${Date.now()}`.slice(0, 40),
    notes: {
      tenantId: String(sale.tenantId),
      saleId: String(sale._id),
      customerRef: String(customerRef)
    }
  })

  await Payment.create({
    tenantId: sale.tenantId,
    customerId: String(sale.customerId),
    customerRef,
    saleId: String(sale._id),
    orderId: order.id,
    amount,
    currency: 'INR',
    status: 'Pending',
    paymentMethod: 'Razorpay'
  })

  return { orderId: order.id, amountInPaise: order.amount }
}

async function markPaid(payment, paymentId, verifiedBy) {
  const paidAt = new Date()
  const updated = await Payment.findOneAndUpdate(
    { _id: payment._id, status: { $ne: 'Success' } },
    { $set: { paymentId, status: 'Success', verifiedBy, paidAt, failureReason: '' } },
    { returnDocument: 'after' }
  )

  if (!updated) {
    const current = await Payment.findById(payment._id).lean()
    return { alreadyDone: true, samePayment: current?.paymentId === paymentId }
  }

  const sale = await Sale.findOneAndUpdate(
    { _id: updated.saleId, tenantId: updated.tenantId },
    { $inc: { amountPaid: updated.amount } },
    { returnDocument: 'after' }
  )

  if (sale) {
    const fullyPaid = balanceOf(sale) < 1
    await Sale.updateOne(
      { _id: sale._id },
      { $set: { paymentStatus: fullyPaid ? 'Paid' : 'Partially Paid', ...(fullyPaid ? { paidAt } : {}) } }
    )
  }

  return { alreadyDone: false, samePayment: true }
}

async function noteFailure(orderId, reason) {
  await Payment.updateOne(
    { orderId, status: 'Pending' },
    { $set: { failureReason: String(reason || 'Payment failed').slice(0, 300) } }
  )
}

module.exports = {
  fail,
  balanceOf,
  isPaid,
  checkoutSignatureMatches,
  webhookSignatureMatches,
  createOrderForSale,
  markPaid,
  noteFailure
}