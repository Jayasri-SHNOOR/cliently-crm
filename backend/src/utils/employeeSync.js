const { getAuth } = require('firebase-admin/auth')
const User = require('../models/User')
const Session = require('../models/Session')
const ROLE_MAP = {
  'Manager': 'MANAGER',
  'Sales Executive': 'SALES_EXECUTIVE',
  'Operational Staff': 'OPERATIONAL_STAFF'
}


const DISPLAY_ROLE = Object.fromEntries(
  Object.entries(ROLE_MAP).map(([display, constant]) => [constant, display])
)

async function revokeUserSessions(userId, reason) {
  await Session.updateMany(
    { userId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  )
}

async function syncLinkedUser(employee, updates) {
  const user = await User.findOne({ employeeId: employee._id, tenantId: employee.tenantId })
  if (!user) return


  const fb = {}
  if (updates.email) fb.email = updates.email
  if (updates.name) fb.displayName = updates.name
  if (updates.status) fb.disabled = updates.status !== 'Active'
  if (Object.keys(fb).length) await getAuth().updateUser(user.firebaseUid, fb)


  const set = {}
  if (updates.name) set.name = updates.name
  if (updates.email) set.email = updates.email
  if (updates.role) set.role = ROLE_MAP[updates.role]
  if (updates.phone !== undefined) set.mobileNumber = updates.phone
  if (updates.status) set.status = updates.status
  if (Object.keys(set).length) {
    await User.updateOne({ _id: user._id }, { $set: set }, { runValidators: true })
  }


  if (updates.status && updates.status !== 'Active') {
    await getAuth().revokeRefreshTokens(user.firebaseUid)
    await revokeUserSessions(user._id, 'user_inactive')
  } else if (updates.role) {
    await revokeUserSessions(user._id, 'role_changed')
  }
}

module.exports = { ROLE_MAP, DISPLAY_ROLE, revokeUserSessions, syncLinkedUser }