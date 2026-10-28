const mongoose = require('mongoose')
const LEAD_STATUSES = ['New', 'Contacted', 'Qualified', 'Demo', 'Proposal', 'Negotiation', 'Won', 'Lost']
const PRODUCTS = ['CRM Software', 'Website Development', 'CRM + Website Development', 'Other']

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
    productInterested:{ 
        type: String, 
        enum: PRODUCTS, 
        default: 'CRM Software' 
    },
    executive:{ 
        type: String, 
        trim: true 
    } 
  },
  { 
    timestamps: true,
    collection: 'leads' 
}
)
leadSchema.index({ tenantId: 1, createdAt: -1 })
module.exports = mongoose.model('Lead', leadSchema)
module.exports.LEAD_STATUSES = LEAD_STATUSES
module.exports.PRODUCTS = PRODUCTS