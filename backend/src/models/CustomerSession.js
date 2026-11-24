const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const REVOKE_REASONS = ['logout', 'idle', 'expired', 'account_inactive', 'password_changed', 'tenant_inactive']

const customerSessionSchema = new mongoose.Schema(
  {
    accountId: { type: ObjectId, ref: 'CustomerAccount', required: true },
    customerId: { type: ObjectId, ref: 'Customer', required: true },
    tenantId: { type: ObjectId, ref: 'Tenant', required: true },
    refreshTokenHash: { type: String, required: true },
    lastActivityAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, enum: REVOKE_REASONS, default: null },
    userAgent: { type: String, trim: true, maxlength: 300 },
    ip: { type: String, trim: true, maxlength: 64 }
  },
  { timestamps: true, versionKey: false, collection: 'customer_sessions' }
)

customerSessionSchema.index({ refreshTokenHash: 1 }, { unique: true })
customerSessionSchema.index({ accountId: 1, revokedAt: 1 })
customerSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('CustomerSession', customerSessionSchema)
module.exports.REVOKE_REASONS = REVOKE_REASONS