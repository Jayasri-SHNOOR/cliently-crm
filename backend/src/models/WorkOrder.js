const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types
const WORK_ORDER_STATUSES = ['Planned', 'In Progress', 'On Hold', 'Completed', 'Cancelled']
const WORK_ORDER_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']

const customerSchema = new mongoose.Schema(
  {
    name:{type: String, required: [true, 'Customer name is required'], trim: true, maxlength: 100},
    email: {type: String, trim: true, lowercase: true, maxlength: 120},
    phone: {type: String, trim: true, maxlength: 20},
    company: {type: String, trim: true, maxlength: 120}
  },
  { _id: false }
)

const milestoneSchema = new mongoose.Schema({
  title: {type: String, required: [true, 'Milestone title is required'], trim: true, maxlength: 150},
  dueDate: {type: Date, default: null},
  done: {type: Boolean, default: false},
  doneAt: {type: Date, default: null}
})

const workOrderSchema = new mongoose.Schema(
  {
    tenantId: {type: ObjectId, ref: 'Tenant', required: true},
    number: {type: Number, required: true},
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title must be 150 characters or less']
    },
    description: {type: String, trim: true, maxlength: [5000, 'Description must be 5000 characters or less']},
    customer: {type: customerSchema, required: [true, 'Customer details are required']},
    dealId: {type: ObjectId, ref: 'Deal', default: null},
    productId: {type: ObjectId, ref: 'Product', default: null},
    assignedTo: {type: ObjectId, ref: 'Employee', default: null},
    status: {type: String, enum: WORK_ORDER_STATUSES, default: 'Planned'},
    priority: {type: String, enum: WORK_ORDER_PRIORITIES, default: 'Medium'},
    startDate: {type: Date, default: null},
    dueDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(value){
          return !value || !this.startDate || value >= this.startDate
        },
        message: 'Due date cannot be before the start date'
      }
    },
    milestones: [milestoneSchema],
    completedAt: {type: Date, default: null},
    createdBy: {type: ObjectId, ref: 'User'}
  },
  {timestamps: true, collection: 'work_orders', toJSON: {virtuals: true}}
)

workOrderSchema.virtual('progress').get(function(){
  if(!this.milestones || this.milestones.length === 0){
    return this.status === 'Completed' ? 100 : 0
  }
  const done = this.milestones.filter((milestone) => milestone.done).length
  return Math.round((done / this.milestones.length) * 100)
})

workOrderSchema.index({tenantId: 1, number: 1}, {unique: true})
workOrderSchema.index({tenantId: 1, createdAt: -1})
workOrderSchema.index({tenantId: 1, status: 1, dueDate: 1})
workOrderSchema.index({tenantId: 1, dealId: 1})

module.exports = mongoose.model('WorkOrder', workOrderSchema)
module.exports.WORK_ORDER_STATUSES = WORK_ORDER_STATUSES
module.exports.WORK_ORDER_PRIORITIES = WORK_ORDER_PRIORITIES