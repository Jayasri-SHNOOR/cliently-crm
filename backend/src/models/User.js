const mongoose = require('mongoose')
const ROLES = ['SUPER_ADMIN', 'CLIENT_ADMIN', 'SALES_USER']
const STATUSES = ['Active', 'Inactive']

const userSchema = new mongoose.Schema(
  {
    firebaseUid:{
      type: String,
      required: [true, 'Firebase UID is required'],
      unique: true,
      trim: true
    },
    email:{
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    name:{
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name must be 100 characters or less']
    },
    mobileNumber:{
      type: String,
      trim: true,
      maxlength: [20, 'Mobile number must be 20 characters or less']
    },
    role:{
      type: String,
      required: [true, 'Role is required'],
      enum: { values: ROLES, message: 'Role must be one of: ' + ROLES.join(', ') }
    },
    tenantId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [
        function(){
          return this.role !== 'SUPER_ADMIN'
        },
        'Company (tenantId) is required for this role'
      ],
      validate:{
        validator: function(value){
          return !(this.role === 'SUPER_ADMIN' && value)
        },
        message: 'A super admin does not belong to a company'
      }
    },
    employeeId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee'
    },
    status:{
      type: String,
      enum: STATUSES,
      default: 'Active'
    },
    lastLoginAt: {type: Date}
  },
  {timestamps: true, collection: 'users'}
)
userSchema.index({ tenantId: 1, role: 1 })

module.exports = mongoose.model('User', userSchema)
module.exports.ROLES = ROLES
module.exports.STATUSES = STATUSES