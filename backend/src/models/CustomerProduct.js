const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const customerProductSchema = new mongoose.Schema(
  {
    tenantId: { type: ObjectId, ref: 'Tenant', required: true },
    customerId: { type: ObjectId, ref: 'Customer', required: true },
    productId: { type: ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true, trim: true, maxlength: 120 },
    serialNumber: { type: String, default: '', trim: true, maxlength: 60 },
    purchaseDate: { type: Date, default: null },
    warrantyUntil: { type: Date, default: null },
    addedBy: { type: ObjectId, ref: 'User', default: null }
  },
  { timestamps: true, versionKey: false, collection: 'customer_products' }
)

customerProductSchema.index({ tenantId: 1, customerId: 1, createdAt: -1 })

module.exports = mongoose.model('CustomerProduct', customerProductSchema)