const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const CUSTOMER_STATUSES = ['Active', 'Inactive', 'Prospect']

const customerSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', required: true, index: true },
    customerCode: { type: String, trim: true },
    userId: { type: String, default: '' },
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [120, 'Name must be 120 characters or less']
    },
    company: { type: String, default: '', trim: true, maxlength: 120 },
    email: { type: String, default: '', trim: true, lowercase: true, maxlength: 120 },
    phone: { type: String, default: '', trim: true, maxlength: 20 },
    address: { type: String, default: '', trim: true, maxlength: 300 },
    city: { type: String, default: '', trim: true, maxlength: 80 },
    customerType: { type: String, default: 'regular', trim: true },
    registrationDate: { type: String, default: '' },
    status: { type: String, enum: CUSTOMER_STATUSES, default: 'Active' },
    leadId: { type: ObjectId, ref: 'Lead', default: null },
    ownerId: { type: ObjectId, ref: 'Employee', default: null },
    ownerName: { type: String, trim: true, maxlength: 100 },
    notes: { type: String, trim: true, maxlength: 1000 }
  },
  { timestamps: true, collection: 'customers' }
)

customerSchema.index(
  { tenantId: 1, customerCode: 1 },
  { unique: true, partialFilterExpression: { customerCode: { $type: 'string' } } }
)
customerSchema.index({ tenantId: 1, createdAt: -1 })
customerSchema.index({ tenantId: 1, ownerId: 1, createdAt: -1 })
customerSchema.index({ tenantId: 1, email: 1 })
customerSchema.index(
  { tenantId: 1, leadId: 1 },
  { unique: true, partialFilterExpression: { leadId: { $type: 'objectId' } } }
)

module.exports = mongoose.model('Customer', customerSchema)
module.exports.CUSTOMER_STATUSES = CUSTOMER_STATUSES