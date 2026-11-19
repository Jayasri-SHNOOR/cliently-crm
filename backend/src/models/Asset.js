const mongoose = require('mongoose')
const {ObjectId} = mongoose.Schema.Types

const ASSET_TYPES = ['Hardware', 'Software', 'License', 'Consumable']
const ASSET_STATUSES = ['In Stock', 'Assigned', 'In Repair', 'Retired']

const assignmentSchema = new mongoose.Schema(
  {
    customerName: {type: String, trim: true, maxlength: 120},
    workOrderId: {type: ObjectId, ref: 'WorkOrder', default: null},
    assignedAt: {type: Date, default: null}
  },
  {_id: false}
)

const assetSchema = new mongoose.Schema(
  {
    tenantId:{type: ObjectId, ref: 'Tenant', required: true},
    name: {
      type: String,
      required: [true, 'Asset name is required'],
      trim: true,
      maxlength: [120, 'Name must be 120 characters or less']
    },
    code: {type: String, trim: true, maxlength: 40},
    type: {type: String, enum: ASSET_TYPES, required: [true, 'Asset type is required']}, 
    category: {type: String, trim: true, maxlength: 60},
    quantity: {type: Number, default: 1, min: [0, 'Quantity cannot be negative']},
    unit: {type: String, trim: true, maxlength: 20, default: 'pcs'},
    reorderLevel: {type: Number, default: 0, min: [0, 'Reorder level cannot be negative']},
    status: {type: String, enum: ASSET_STATUSES, default: 'In Stock'},
    serialNumber: {type: String, trim: true, maxlength: 80},
    location: {type: String, trim: true, maxlength: 120},
    cost: {type: Number, min: [0, 'Cost cannot be negative']},
    purchaseDate: {type: Date, default: null},
    warrantyUntil: {type: Date, default: null},
    productId: {type: ObjectId, ref: 'Product', default: null},
    assignment: {type: assignmentSchema, default: null},
    notes: {type: String, trim: true, maxlength: 1000}
  },
  {timestamps: true, collection: 'assets', toJSON: {virtuals: true}}
)

assetSchema.virtual('lowStock').get(function (){
  return this.status !== 'Retired' && this.quantity <= this.reorderLevel
})

assetSchema.index(
  {tenantId: 1, code: 1},
  {unique: true, partialFilterExpression: {code: {$type: 'string'}}}
)
assetSchema.index({tenantId: 1, createdAt: -1})
assetSchema.index({tenantId: 1, status: 1, type: 1})
assetSchema.index({tenantId: 1, 'assignment.workOrderId': 1})

module.exports = mongoose.model('Asset', assetSchema)
module.exports.ASSET_TYPES = ASSET_TYPES
module.exports.ASSET_STATUSES = ASSET_STATUSES