const mongoose = require('mongoose')
const { ObjectId } = mongoose.Schema.Types

const MAX_ITEMS = 50
const TAX_RATES = [0, 5, 12, 18, 28]

const lineItemSchema = new mongoose.Schema(
  {
    productId: { type: ObjectId, ref: 'Product', default: null },
    product: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [120, 'Item name must be 120 characters or less']
    },
    productType: { type: String, enum: ['Product', 'Service'], default: 'Product' },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      max: [10000, 'Quantity is too large'],
      validate: { validator: Number.isInteger, message: 'Quantity must be a whole number' }
    },
    unitPrice: {
      type: Number,
      required: [true, 'Unit price is required'],
      min: [0, 'Unit price cannot be negative']
    },
    taxRate: {
      type: Number,
      default: 0,
      enum: { values: TAX_RATES, message: 'GST must be 0, 5, 12, 18 or 28' }
    },
    amount: { type: Number, default: 0 }
  },
  { _id: true }
)

function round2(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function calculateTotals(items) {
  let subtotal = 0
  let taxTotal = 0
  for (const item of items || []) {
    item.amount = round2(item.quantity * item.unitPrice)
    subtotal += item.amount
    taxTotal += round2((item.amount * (item.taxRate || 0)) / 100)
  }
  subtotal = round2(subtotal)
  taxTotal = round2(taxTotal)
  return { subtotal, taxTotal, total: round2(subtotal + taxTotal) }
}

const itemsField = {
  type: [lineItemSchema],
  validate: [
    { validator: (items) => Array.isArray(items) && items.length > 0, message: 'Add at least one item' },
    { validator: (items) => items.length <= MAX_ITEMS, message: `At most ${MAX_ITEMS} items allowed` }
  ]
}

module.exports = { lineItemSchema, itemsField, calculateTotals, round2, MAX_ITEMS, TAX_RATES }