const mongoose = require('mongoose')
const { itemsField, calculateTotals } = require('./schemas/lineItems')
const { ObjectId } = mongoose.Schema.Types

const QUOTATION_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']

const quotationSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', required: true, index: true },
    number: { type: String, required: true },
    dealId: { type: ObjectId, ref: 'Deal', required: true },
    leadId: { type: ObjectId, ref: 'Lead', default: null },
    customer: { type: String, required: true, trim: true },
    customerRef: { type: ObjectId, ref: 'Customer', default: null },
    items: itemsField,
    subtotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: QUOTATION_STATUSES, default: 'Draft' },
    validUntil: { type: Date },
    notes: { type: String, trim: true, maxlength: 1000, default: '' },
    executive: { type: String, trim: true },
    executiveId: { type: ObjectId, ref: 'Employee', default: null },
    sentAt: { type: Date, default: null },
    acceptedAt: { type: Date, default: null },
    rejectedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    saleId: { type: ObjectId, ref: 'Sale', default: null }
  },
  { timestamps: true, collection: 'quotations' }
)

quotationSchema.index({ tenantId: 1, number: 1 }, { unique: true })
quotationSchema.index({ tenantId: 1, createdAt: -1 })
quotationSchema.index({ tenantId: 1, executiveId: 1, createdAt: -1 })
quotationSchema.index({ tenantId: 1, leadId: 1 })

quotationSchema.pre('validate', function () {
  const totals = calculateTotals(this.items)
  this.subtotal = totals.subtotal
  this.taxTotal = totals.taxTotal
  this.amount = totals.total
})

module.exports = mongoose.model('Quotation', quotationSchema)
module.exports.QUOTATION_STATUSES = QUOTATION_STATUSES