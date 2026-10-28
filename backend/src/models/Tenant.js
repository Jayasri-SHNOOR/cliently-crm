const mongoose = require('mongoose')
const INDUSTRIES = ['software', 'consulting', 'finance', 'healthcare', 'education', 'retail', 'other']

const tenantSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    companyName: { type: String, required: [true, 'Company name is required'], trim: true, maxlength: 100 },
    adminName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name can be at most 100 characters']
    },
    adminEmail: { type: String, lowercase: true, trim: true },
    adminPhone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number can be at most 20 characters'],
      match: [/^\+?[0-9\s-]{7,20}$/, 'Please enter a valid phone number']
    },
    plan: {type: String, default: 'Professional'},
    seats: {type: Number, default: 15},
    status: {type: String, enum: ['Active', 'Suspended'], default: 'Active'},

    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    phone: {type: String, trim: true, maxlength: 20},
    website: {
      type: String,
      trim: true,
      match: [/^https?:\/\/\S+$/, 'Website must start with http:// or https://']
    },
    industry: {type: String, enum: INDUSTRIES},
    address: {type: String, trim: true, maxlength: 300},
    nextBillingDate: {type: Date},
    paymentMethod: {
      type: {type: String, enum: ['UPI', 'Card', 'NetBanking'], default: 'UPI'},
      upiId: {type: String, trim: true, lowercase: true}
    },
    notificationsReadAt: {type: Date}
  },
  {timestamps: true, collection: 'tenants'}
)

module.exports = mongoose.model('Tenant', tenantSchema)
module.exports.INDUSTRIES = INDUSTRIES