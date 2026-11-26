const Employee = require('../../../models/Employee')
const { ROLES, PERMISSIONS } = require('../../../config/roles')
const AppError = require('../../../utils/AppError')
const { getSeatUsage, assertSeatAvailable } = require('../../../utils/seats')
const { ROLE_MAP, DISPLAY_ROLE, syncLinkedUser } = require('../../../utils/employeeSync')

function formatUser(employee) {
  return {
    id: employee._id,
    name: employee.name,
    email: employee.email,
    role: employee.role,
    status: employee.status,
    updatedAt: employee.updatedAt
  }
}

async function findUser(req) {
  const employee = await Employee.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId
  })

  if (!employee) {
    throw new AppError('User not found', 404)
  }

  return employee
}

async function listUsers(req, res, next) {
  try {
    const { tenantId } = req.user
    const status = typeof req.query.status === 'string' ? req.query.status : ''

    const filter = { tenantId }
    if (status) filter.status = status

    const [users, totalUsers, seats] = await Promise.all([
      Employee.find(filter).sort({ name: 1 }).select('name email role status updatedAt').lean(),
      Employee.countDocuments({ tenantId }),
      getSeatUsage(tenantId)
    ])

    res.json({
      summary: {
        totalUsers,
        activeUsers: seats.used,
        inactiveUsers: totalUsers - seats.used,
        seats
      },
      users: users.map(formatUser)
    })
  } catch (err) {
    next(err)
  }
}

function listRoles(req, res) {
  const roles = Object.entries(ROLES).map(([name, role]) => ({
    name,
    description: role.description,
    permissions: role.permissions.map((key) => ({ key, label: PERMISSIONS[key] }))
  }))

  res.json({ roles })
}

async function updateRole(req, res, next) {
  try {
    const { role } = req.body

    // body carries the User role constant (MANAGER / SALES_EXECUTIVE / OPERATIONAL_STAFF)
    const displayRole = typeof role === 'string' ? DISPLAY_ROLE[role] : undefined
    if (!displayRole) {
      throw new AppError(`Role must be one of: ${Object.values(ROLE_MAP).join(', ')}`, 400)
    }

    const employee = await findUser(req)

    await syncLinkedUser(employee, { role: displayRole })   // User + sessions
    employee.role = displayRole
    await employee.save()

    res.json(formatUser(employee))
  } catch (err) {
    next(err)
  }
}

async function deactivateUser(req, res, next) {
  try {
    const employee = await findUser(req)

    if (employee.status === 'Inactive') {
      throw new AppError('User is already inactive', 409)
    }

    await syncLinkedUser(employee, { status: 'Inactive' })  // Firebase disable + User + sessions
    employee.status = 'Inactive'
    await employee.save()

    res.json(formatUser(employee))
  } catch (err) {
    next(err)
  }
}

async function activateUser(req, res, next) {
  try {
    const employee = await findUser(req)

    if (employee.status === 'Active') {
      throw new AppError('User is already active', 409)
    }

    await assertSeatAvailable(req.user.tenantId)

    await syncLinkedUser(employee, { status: 'Active' })    // Firebase enable + User
    employee.status = 'Active'
    await employee.save()

    res.json(formatUser(employee))
  } catch (err) {
    next(err)
  }
}

module.exports = { listUsers, listRoles, updateRole, deactivateUser, activateUser }