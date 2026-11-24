const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const SALE_TYPES = ['Product', 'Service']
const SALE_STATUSES = ['Confirmed', 'Processing', 'Delivered', 'Installed', 'Cancelled']
const SALE_PAYMENT_STATUSES = ['Unpaid', 'Partially Paid', 'Paid', 'Refunded']

const saleSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', index: true },
    customerId: { type: String, required: true },
    employeeId: { type: String, default: '' },
    saleDate: { type: String, default: '' },
    totalAmount: { type: Number, default: 0, min: 0 },
    saleStatus: { type: String, default: '' },
    paymentStatus: { type: String, default: '' },
    items: { type: Array, default: [] },

    saleNumber: { type: String, trim: true },
    type: { type: String, enum: SALE_TYPES, default: 'Product' },
    customerRef: { type: ObjectId, ref: 'Customer', default: null },
    executiveId: { type: ObjectId, ref: 'Employee', default: null },
    quotationId: { type: ObjectId, ref: 'Quotation', default: null },
    ticketId: { type: ObjectId, ref: 'Ticket', default: null },
    workOrderId: { type: ObjectId, ref: 'WorkOrder', default: null },
    subtotal: { type: Number, default: 0, min: 0 },
    taxTotal: { type: Number, default: 0, min: 0 },
    amountPaid: { type: Number, default: 0, min: 0 },
    paidAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false, collection: 'sales' }
)

saleSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 })
saleSchema.index({ tenantId: 1, customerRef: 1, createdAt: -1 })
saleSchema.index(
  { tenantId: 1, saleNumber: 1 },
  { unique: true, partialFilterExpression: { saleNumber: { $type: 'string' } } }
)
saleSchema.index(
  { tenantId: 1, quotationId: 1 },
  { unique: true, partialFilterExpression: { quotationId: { $type: 'objectId' } } }
)

module.exports = mongoose.model('Sale', saleSchema)
module.exports.SALE_TYPES = SALE_TYPES
module.exports.SALE_STATUSES = SALE_STATUSES
module.exports.SALE_PAYMENT_STATUSES = SALE_PAYMENT_STATUSES