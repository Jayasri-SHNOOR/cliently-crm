const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const TICKET_STATUSES = ['Open', 'In Progress', 'Waiting on Customer', 'Resolved', 'Closed']
const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
const TICKET_CATEGORIES = ['Technical', 'Billing', 'Delivery', 'General']

const customerSchema = new mongoose.Schema(
  {
    name: {type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 100 },
    email: {type: String, trim: true, lowercase: true, maxlength: 120},
    phone: {type: String, trim: true, maxlength: 20},
    company: {type: String, trim: true, maxlength: 120}
  },
  { _id: false }
)

const noteSchema = new mongoose.Schema(
  {
    authorId: {type: ObjectId, ref: 'User'},
    authorName: {type: String, trim: true, maxlength: 100},
    text: {type: String, required: [true, 'Note text is required'], trim: true, maxlength: 2000}
  },
  {timestamps: {createdAt: true, updatedAt: false}}
)

const ticketSchema = new mongoose.Schema(
  {
    tenantId: {type: ObjectId, ref: 'Tenant', required: true},
    number: { type: Number, required: true },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [150, 'Subject must be 150 characters or less']
    },
    description: { type: String, trim: true, maxlength: [5000, 'Description must be 5000 characters or less'] },
    customer: { type: customerSchema, required: [true, 'Customer details are required'] },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'General' },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'Medium' },
    status: { type: String, enum: TICKET_STATUSES, default: 'Open' },
    assignedTo: { type: ObjectId, ref: 'Employee', default: null },
    productId: { type: ObjectId, ref: 'Product', default: null },
    notes: [noteSchema],
    createdBy: { type: ObjectId, ref: 'User' },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null }
  },
  { timestamps: true, collection: 'customer_tickets' }
)

ticketSchema.index({ tenantId: 1, number: 1 }, { unique: true })
ticketSchema.index({ tenantId: 1, createdAt: -1 })
ticketSchema.index({ tenantId: 1, status: 1, priority: 1 })
ticketSchema.index({ tenantId: 1, assignedTo: 1, status: 1 })

module.exports = mongoose.model('Ticket', ticketSchema)
module.exports.TICKET_STATUSES = TICKET_STATUSES
module.exports.TICKET_PRIORITIES = TICKET_PRIORITIES
module.exports.TICKET_CATEGORIES = TICKET_CATEGORIES