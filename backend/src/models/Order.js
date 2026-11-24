const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types
const { itemsField, applyTotals } = require('./schemas/lineItems')

const ORDER_STATUSES = ['Confirmed', 'Processing', 'Delivered', 'Installed', 'Cancelled']
const PAYMENT_STATUSES = ['Unpaid', 'Partially Paid', 'Paid', 'Refunded']

const orderSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', required: true },
    number: { type: Number, required: true },
    customerId: { type: ObjectId, ref: 'Customer', required: [true, 'Customer is required'] },
    quotationId: { type: ObjectId, ref: 'Quotation', default: null },
    items: itemsField,
    subtotal: { type: Number, default: 0 },
    taxTotal: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ORDER_STATUSES, default: 'Confirmed' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Unpaid' },
    salesExecutiveId: { type: ObjectId, ref: 'Employee', default: null },
    salesExecutiveName: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: [1000, 'Notes must be 1000 characters or less'] },
    cancelledAt: { type: Date, default: null },
    createdBy: { type: ObjectId, ref: 'User' }
  },
  { timestamps: true, collection: 'orders' }
)

orderSchema.pre('validate', function () {
  applyTotals(this)
})

orderSchema.index({ tenantId: 1, number: 1 }, { unique: true })
orderSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 })
orderSchema.index({ tenantId: 1, status: 1, createdAt: -1 })
orderSchema.index(
  { tenantId: 1, quotationId: 1 },
  { unique: true, partialFilterExpression: { quotationId: { $type: 'objectId' } } }
)

module.exports = mongoose.model('Order', orderSchema)
module.exports.ORDER_STATUSES = ORDER_STATUSES
module.exports.PAYMENT_STATUSES = PAYMENT_STATUSES