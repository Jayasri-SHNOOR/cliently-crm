const mongoose = require('mongoose')
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost']

const leadSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Tenant',                         
      required: true,
      index: true
    },
    name:{ 
        type: String, 
        required: [true, 'Lead name is required'], 
        trim: true 
    },
    email:{ 
        type: String, 
        lowercase: true, 
        trim: true },
    company:{ 
        type: String, 
        trim: true 
    },
    phone:{ 
        type: String, 
        trim: true 
    },
    status:{ 
        type: String, 
        enum: LEAD_STATUSES,
        default: 'New' },
    value:{ 
        type: Number, 
        default: 0, 
        min: [0, 'Value cannot be negative'] 
    },
    productInterested: {
        type: String,
        trim: true,
        maxlength: 120,
        default: 'General enquiry'
    },
    executive:{ 
        type: String, 
        trim: true 
    },
    priority: {
  type: String,
  enum: ['High', 'Medium', 'Low'],
  default: undefined
},
    nextFollowUp: { type: Date },
    assignedAt: { type: Date },
    source: { type: String, enum: ['Manual', 'Website', 'Import'], default: 'Manual' },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    productName: { type: String, trim: true, maxlength: 120 },
    message: { type: String, trim: true, maxlength: 1000 },
    enquiryCount: { type: Number, default: 0, min: 0 },
    lastEnquiryAt: { type: Date },
    consentAt: { type: Date }
  },
  { 
    timestamps: true,
    collection: 'leads' 
}
)
leadSchema.index({ tenantId: 1, createdAt: -1 })
leadSchema.index({ tenantId: 1, email: 1 })
module.exports = mongoose.model('Lead', leadSchema)
module.exports.LEAD_STATUSES = LEAD_STATUSES