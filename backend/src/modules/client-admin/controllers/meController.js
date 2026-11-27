const Tenant = require('../../../models/Tenant')
const User = require('../../../models/User')
const Employee = require('../../../models/Employee')
const AppError = require('../../../utils/AppError')

const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/

function initialsOf(name) {
  return String(name || '')
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function buildMe(req) {
  const [tenant, user] = await Promise.all([
    Tenant.findById(req.user.tenantId).select('companyName plan').lean(),
    User.findOne({ _id: req.user.id, tenantId: req.user.tenantId }).select('name email mobileNumber role').lean()
  ])
  if (!tenant) throw new AppError('Company not found', 404)
  if (!user) throw new AppError('User account not found', 404)

  return {
    name: user.name,
    email: user.email,
    phone: user.mobileNumber || '',
    initials: initialsOf(user.name),
    role: user.role,
    roleLabel: user.role === 'CLIENT_ADMIN' ? 'Admin' : 'User',
    company: {
      id: tenant._id,
      name: tenant.companyName,
      plan: tenant.plan
    }
  }
}

async function getMe(req, res, next) {
  try {
    res.json(await buildMe(req))
  } catch (err) {
    next(err)
  }
}

async function updateMe(req, res, next) {
  try {
    const body = req.body || {}
    const set = {}

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : ''
      if (name.length < 2 || name.length > 80) throw new AppError('Name must be 2 to 80 characters', 400)
      set.name = name
    }

    if (body.phone !== undefined) {
      const phone = typeof body.phone === 'string' ? body.phone.trim() : ''
      if (phone && !PHONE_PATTERN.test(phone)) throw new AppError('Enter a valid phone number', 400)
      set.mobileNumber = phone
    }

    if (body.email !== undefined) {
      const current = await User.findOne({ _id: req.user.id, tenantId: req.user.tenantId }).select('email').lean()
      const wanted = String(body.email || '').trim().toLowerCase()
      if (current && wanted && wanted !== String(current.email || '').toLowerCase()) {
        throw new AppError('Your sign-in email cannot be changed here. Contact Cliently support.', 400)
      }
    }

    if (Object.keys(set).length === 0) throw new AppError('Nothing to update', 400)

    const user = await User.findOneAndUpdate(
      { _id: req.user.id, tenantId: req.user.tenantId },
      { $set: set },
      { new: true }
    ).lean()
    if (!user) throw new AppError('User account not found', 404)

    if (user.employeeId) {
      const employeeSet = {}
      if (set.name) employeeSet.name = set.name
      if (set.mobileNumber !== undefined) employeeSet.phone = set.mobileNumber
      await Employee.updateOne({ _id: user.employeeId, tenantId: req.user.tenantId }, { $set: employeeSet })
    }

    res.json({ message: 'Profile updated successfully', user: await buildMe(req) })
  } catch (err) {
    next(err)
  }
}

module.exports = { getMe, updateMe }