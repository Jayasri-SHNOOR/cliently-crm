const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const ACCOUNT_STATUSES = ['Pending', 'Active', 'Disabled']

const customerAccountSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', required: true, index: true },
    customerId: { type: ObjectId, ref: 'Customer', required: true },
    loginId: { type: String, required: true, uppercase: true, trim: true },
    passwordHash: { type: String, default: '', select: false },
    status: { type: String, enum: ACCOUNT_STATUSES, default: 'Pending' },
    activationTokenHash: { type: String, default: null, select: false },
    activationExpiresAt: { type: Date, default: null },
    failedAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    issuedBy: { type: ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, versionKey: false, collection: 'customer_accounts' }
)

customerAccountSchema.index({ tenantId: 1, loginId: 1 }, { unique: true })
customerAccountSchema.index({ tenantId: 1, customerId: 1 }, { unique: true })
customerAccountSchema.index(
  { activationTokenHash: 1 },
  { unique: true, partialFilterExpression: { activationTokenHash: { $type: 'string' } } }
)

module.exports = mongoose.model('CustomerAccount', customerAccountSchema)
module.exports.ACCOUNT_STATUSES = ACCOUNT_STATUSES