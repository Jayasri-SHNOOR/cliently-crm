const mongoose = require('mongoose')
const productSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['Product', 'Service'],
      required: true
    },
    category: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    billing: {
      type: String,
      enum: ['Monthly', 'Yearly', 'One-time']
    },
    duration: {
      type: String
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    },
    showOnWebsite: { type: Boolean, default: true },
    imageUrl: { type: String, trim: true, match: [/^https?:\/\/\S+$/, 'Image URL must start with http:// or https://'] }
  },
  {
    timestamps: true,
    collection: 'products'
  }
)
productSchema.index(
  { tenantId: 1, code: 1 },
  { unique: true, partialFilterExpression: { code: { $type: 'string' } } }
)
productSchema.index({ tenantId: 1, createdAt: -1 })
productSchema.index({ tenantId: 1, status: 1, showOnWebsite: 1 })
module.exports = mongoose.model('Product', productSchema)