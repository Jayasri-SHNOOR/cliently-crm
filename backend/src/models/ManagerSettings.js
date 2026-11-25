
const mongoose = require('mongoose')

const managerSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  profile: {
    firstName: { type: String, trim: true, maxlength: 100, default: '' },
    middleName: { type: String, trim: true, maxlength: 100, default: '' },
    lastName: { type: String, trim: true, maxlength: 100, default: '' },
    countryCode: { type: String, trim: true, default: '+91' },
    phone: { type: String, trim: true, default: '' },
    dateOfBirth: { type: Date, default: null },
    emergencyName: { type: String, trim: true, default: '' },
    emergencyRelationship: { type: String, trim: true, default: '' },
    emergencyPhone: { type: String, trim: true, default: '' },
    address: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    postalCode: { type: String, trim: true, default: '' }
  },
  notifications: {
    email: { type: Boolean, default: true },
    tasks: { type: Boolean, default: true },
    meetings: { type: Boolean, default: true },
    announcements: { type: Boolean, default: false }
  }
}, { timestamps: true })

managerSettingsSchema.index({ userId: 1 }, { unique: true })
managerSettingsSchema.index({ tenantId: 1 })

module.exports = mongoose.model('ManagerSettings', managerSettingsSchema)
