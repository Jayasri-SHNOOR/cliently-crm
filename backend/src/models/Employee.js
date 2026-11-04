const mongoose = require('mongoose')
const employeeSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true
    },

    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true
    },

    email: {
      type: String,
      required: [true, 'Employee email is required'],
      lowercase: true,
      trim: true
    },

    role: {
      type: String,
      required: [true, 'Employee role is required'],
      trim: true,
      default: 'Sales Executive'
    },

    department: {
      type: String,
      trim: true,
      default: 'Sales'
    },

    phone: {
      type: String,
      trim: true
    },

    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active'
    }
  },
  {
    timestamps: true,
    collection: 'employees'
  }
)
employeeSchema.index(
  {tenantId: 1, email: 1},
  {unique: true}
)
employeeSchema.index({tenantId: 1, createdAt: -1})
employeeSchema.index({tenantId: 1, name: 1})

module.exports = mongoose.model('Employee', employeeSchema)