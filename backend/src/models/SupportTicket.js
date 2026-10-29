const mongoose = require('mongoose')
const CATEGORIES = ['Technical Issue', 'Billing', 'Account', 'Feature Request', 'Other']
const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const STATUSES = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']
const MAX_MESSAGE_LENGTH = 2000
const MAX_MESSAGES = 100

const messageSchema = new mongoose.Schema(
  {
    authorName: {type: String, required: true, trim: true},
    authorRole: {type: String, enum: ['CLIENT_ADMIN', 'SUPPORT'], required: true},
    text: {type: String, required: true, trim: true, maxlength: MAX_MESSAGE_LENGTH}
  },
  {timestamps: {createdAt: true, updatedAt: false}}
)

const ticketSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },
    ticketNumber: { type: String, required: true },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject must be 150 characters or less']
    },
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, 'Category is required']
    },
    priority: { type: String, enum: PRIORITIES, default: 'Medium' },
    status: { type: String, enum: STATUSES, default: 'Open' },
    createdBy: {
      name: { type: String, trim: true }
    },
    messages: [messageSchema],
    lastActivityAt: { type: Date, default: Date.now },
    closedAt: { type: Date }
  },
  {timestamps: true, collection: 'support_tickets'}
)

ticketSchema.index({ tenantId: 1, ticketNumber: 1 }, { unique: true })
ticketSchema.index({ tenantId: 1, lastActivityAt: -1 })
module.exports = mongoose.model('SupportTicket', ticketSchema)
module.exports.CATEGORIES = CATEGORIES
module.exports.PRIORITIES = PRIORITIES
module.exports.STATUSES = STATUSES
module.exports.MAX_MESSAGE_LENGTH = MAX_MESSAGE_LENGTH
module.exports.MAX_MESSAGES = MAX_MESSAGES