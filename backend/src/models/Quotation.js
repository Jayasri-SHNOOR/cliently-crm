const mongoose = require('mongoose')
const QUOTATION_STATUSES = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired']

const quotationSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    number: { type: String, required: true },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: 'Deal', required: true },
    customer: { type: String, required: true, trim: true },
    items: [
      {
        product: { type: String, required: true, trim: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 }
      }
    ],
    amount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: QUOTATION_STATUSES, default: 'Draft' },
    validUntil: { type: Date },
    executive: { type: String, trim: true }
  },
  { timestamps: true, collection: 'quotations' }
)

quotationSchema.index({ tenantId: 1, number: 1 }, { unique: true })
quotationSchema.index({ tenantId: 1, createdAt: -1 })
quotationSchema.pre('validate', function () {
  this.amount = this.items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0)
})

module.exports = mongoose.model('Quotation', quotationSchema)
module.exports.QUOTATION_STATUSES = QUOTATION_STATUSES