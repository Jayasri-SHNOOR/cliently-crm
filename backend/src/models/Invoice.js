const mongoose = require('mongoose')
const INVOICE_STATUSES = ['Paid', 'Pending', 'Failed']
const invoiceSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    invoiceNumber: { type: String, required: true, trim: true },
    issuedAt: { type: Date, required: true },
    periodStart: { type: Date },
    periodEnd: { type: Date },
    plan: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: INVOICE_STATUSES, default: 'Pending' },
    paymentMethod: { type: String, trim: true }
  },
  { timestamps: true, collection: 'invoices' }
)
invoiceSchema.index({ tenantId: 1, invoiceNumber: 1 }, { unique: true })
invoiceSchema.index({ tenantId: 1, issuedAt: -1 })
module.exports = mongoose.model('Invoice', invoiceSchema)
module.exports.INVOICE_STATUSES = INVOICE_STATUSES