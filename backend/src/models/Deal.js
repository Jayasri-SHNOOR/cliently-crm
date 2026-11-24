const mongoose = require('mongoose')
const DEAL_STATUSES = ['New', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
const CLOSED_STATUSES = ['Won', 'Lost']
const dealSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    name:{ 
        type: String, 
        required: [true, 'Deal name is required'], 
        trim: true 
    },
    customer:{ type: String, 
        required: [true, 'Customer is required'], 
        trim: true 
    },
    product:{ 
        type: String, 
        required: true, 
        trim: true 
    },
    value:{ 
        type: Number, 
        default: 0, 
        min: [0, 'Value cannot be negative'] 
    },
    status:{ 
        type: String, 
        enum: DEAL_STATUSES, 
        default: 'New' 
    },
    assignedTo:{ 
        type: String, 
        trim: true 
    },
    expectedClose:{ 
        type: Date 
    },      
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },   
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', default: null },       
    activities: [
        { type: String, trim: true }
    ],
    assignedToId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null }, 
  },
  { timestamps: true, collection: 'deals' }
)
dealSchema.index({ tenantId: 1, assignedToId: 1, createdAt: -1 })
dealSchema.index({ tenantId: 1, leadId: 1 })
module.exports = mongoose.model('Deal', dealSchema)
module.exports.DEAL_STATUSES = DEAL_STATUSES
module.exports.CLOSED_STATUSES = CLOSED_STATUSES