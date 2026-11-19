
const mongoose = require('mongoose')

const clientSubscriptionSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null
    },

    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },

    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true
    },

    customerCompany: {
      type: String,
      trim: true,
      default: ''
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null
    },

    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true
    },

    amount: {
      type: Number,
      required: [true, 'Subscription amount is required'],
      min: [0, 'Amount cannot be negative']
    },

    billingCycle: {
      type: String,
      enum: ['Monthly', 'Yearly', 'One-time'],
      required: true,
      default: 'Monthly'
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now
    },

    nextBillingDate: {
      type: Date,
      default: null
    },

    endDate: {
      type: Date,
      default: null
    },

    status: {
      type: String,
      enum: ['Active', 'Pending', 'Expired', 'Cancelled'],
      default: 'Pending',
      required: true
    },

    notes: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    collection: 'client_subscriptions'
  }
)

clientSubscriptionSchema.index({ tenantId: 1, createdAt: -1 })
clientSubscriptionSchema.index({ tenantId: 1, status: 1 })
clientSubscriptionSchema.index({ tenantId: 1, customerEmail: 1 })

module.exports =
  mongoose.models.ClientSubscription ||
  mongoose.model('ClientSubscription', clientSubscriptionSchema)
