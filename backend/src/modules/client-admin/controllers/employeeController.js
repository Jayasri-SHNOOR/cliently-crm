const mongoose = require('mongoose')
const crypto = require('crypto')
const { getAuth } = require('firebase-admin/auth')
const Employee = require('../../../models/Employee')
const User = require('../../../models/User')
const { assertSeatAvailable } = require('../../../utils/seats')
const { ROLE_MAP, revokeUserSessions, syncLinkedUser } = require('../../../utils/employeeSync')

const getEmployees = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId

    const employees = await Employee.find({ tenantId })
      .sort({ createdAt: -1 })

    res.status(200).json({
      count: employees.length,
      employees
    })
  } catch (error) {
    next(error)
  }
}

const getEmployeeById = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID' })
    }

    const employee = await Employee.findOne({ _id: id, tenantId })

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    res.status(200).json(employee)
  } catch (error) {
    next(error)
  }
}

const createEmployee = async (req, res, next) => {
  let fbUser, employee, user
  try {
    const tenantId = req.user.tenantId
    const { name, email, department, phone,
            employeeCode, designation, employmentType, dateOfJoining } = req.body
    const role = req.body.role || 'Sales Executive'

    if (!name || !email) {
      return res.status(400).json({ message: 'Employee name and email are required' })
    }
    if (!ROLE_MAP[role]) {
      return res.status(400).json({ message: 'Role must be one of: ' + Object.keys(ROLE_MAP).join(', ') })
    }

    await assertSeatAvailable(tenantId)

    const cleanEmail = email.toLowerCase().trim()

    // Random password nobody knows; employee sets their own via the reset email.
    // hex gives lowercase + digits; the suffix adds an uppercase letter and a symbol
    // so it passes the Firebase project's password policy.
    const throwawayPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!#'

    fbUser = await getAuth().createUser({
      email: cleanEmail,
      displayName: name,
      password: throwawayPassword
    })

    employee = await Employee.create({
      tenantId, name, email: cleanEmail, role, department, phone,
      employeeCode, designation, employmentType, dateOfJoining,
      status: 'Active'
    })

    user = await User.create({
      firebaseUid: fbUser.uid,
      email: cleanEmail,
      name,
      mobileNumber: phone,
      role: ROLE_MAP[role],
      tenantId,                 // from token, never from body
      employeeId: employee._id,
      status: 'Active'
    })

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    })
  } catch (error) {
    // manual rollback
    if (user) await User.deleteOne({ _id: user._id }).catch(() => {})
    if (employee) await Employee.deleteOne({ _id: employee._id }).catch(() => {})
    if (fbUser) await getAuth().deleteUser(fbUser.uid).catch(() => {})

    if (error.code === 'auth/email-already-exists' || error.code === 11000) {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    next(error)
  }
}

const updateEmployee = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID' })
    }

    const allowedFields = [
      'name', 'email', 'role', 'department', 'phone', 'status',
      'employeeCode', 'designation', 'employmentType', 'dateOfJoining'
    ]

    const updates = {}
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Provide at least one field to update' })
    }
    if (updates.role && !ROLE_MAP[updates.role]) {
      return res.status(400).json({ message: 'Role must be one of: ' + Object.keys(ROLE_MAP).join(', ') })
    }
    if (updates.email) updates.email = updates.email.toLowerCase().trim()

    const current = await Employee.findOne({ _id: id, tenantId }).lean()
    if (!current) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    if (updates.status === 'Active' && current.status !== 'Active') {
      await assertSeatAvailable(tenantId)
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    )
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    try {
      await syncLinkedUser(employee, updates)
    } catch (syncErr) {
      // revert the Employee change so Employee / User / Firebase stay consistent
      const previous = {}
      for (const key of Object.keys(updates)) previous[key] = current[key]
      await Employee.updateOne({ _id: id, tenantId }, { $set: previous }).catch(() => {})

      if (syncErr.code === 'auth/email-already-exists') {
        return res.status(409).json({ message: 'An account with this email already exists' })
      }
      throw syncErr
    }

    res.status(200).json({
      message: 'Employee updated successfully',
      employee
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'An employee with this email already exists' })
    }
    next(error)
  }
}

const deleteEmployee = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId
    const { id } = req.params

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID' })
    }

    const employee = await Employee.findOneAndDelete({ _id: id, tenantId })

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' })
    }

    const user = await User.findOneAndDelete({ employeeId: employee._id, tenantId })
    if (user) {
      await revokeUserSessions(user._id, 'user_inactive')
      await getAuth().deleteUser(user.firebaseUid).catch(() => {})
    }

    res.status(200).json({ message: 'Employee deleted successfully' })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
}