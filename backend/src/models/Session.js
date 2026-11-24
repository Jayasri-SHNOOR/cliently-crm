const mongoose = require('mongoose')
const REVOKE_REASONS = ['logout', 'idle', 'expired', 'user_inactive', 'tenant_inactive', 'role_changed', 'reuse']
const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', default: null },
    refreshTokenHash: { type: String, required: true },
    lastActivityAt: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, enum: REVOKE_REASONS, default: null },
    userAgent: { type: String, trim: true, maxlength: 300 },
    ip: { type: String, trim: true, maxlength: 64 }
  },
  { timestamps: true, collection: 'sessions' }
)

sessionSchema.index({ refreshTokenHash: 1 }, { unique: true })
sessionSchema.index({ userId: 1, revokedAt: 1 })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
sessionSchema.methods.isActive = function isActive(now = Date.now()) {
  return !this.revokedAt && this.expiresAt.getTime() > now
}

module.exports = mongoose.model('Session', sessionSchema)
module.exports.REVOKE_REASONS = REVOKE_REASONS