const Session = require('../../../models/Session')
const User = require('../../../models/User')
const Tenant = require('../../../models/Tenant')
const AppError = require('../../../utils/AppError')
const {sessionConfig} = require('../../../config/session')
const {signAccessToken, generateRefreshToken, hashToken} = require('../../../utils/tokens')
const idleMinutes = Math.round(sessionConfig.idleTimeoutMs / 60000)

function issueAccessToken(session, user){
  return signAccessToken({
    userId: user._id,
    sessionId: session._id,
    role: user.role,
    tenantId: user.tenantId
  })
}

async function createSession(user, req){
  const now = new Date()
  const refreshToken = generateRefreshToken()
  const session = await Session.create({
    userId: user._id,
    tenantId: user.tenantId || null,
    refreshTokenHash: hashToken(refreshToken),
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + sessionConfig.absoluteTimeoutMs),
    userAgent: (req.get('user-agent') || '').slice(0, 300),
    ip: req.ip
  })

  return {session, refreshToken, accessToken: issueAccessToken(session, user)}
}

async function findSessionByRefreshToken(refreshToken){
  if(!refreshToken){
    return null
  }
  return Session.findOne({refreshTokenHash: hashToken(refreshToken)})
}

async function revokeSession(session, reason){
  if(!session || session.revokedAt){
    return
  }
  session.revokedAt = new Date()
  session.revokedReason = reason
  await session.save()
}

async function checkSession(session, now = Date.now()){
  if(!session || session.revokedAt){
    throw new AppError('Your session has ended. Please log in again.', 401, 'SESSION_REVOKED')
  }
  if(session.expiresAt.getTime() <= now){
    await revokeSession(session, 'expired')
    throw new AppError('Your session has expired. Please log in again.', 401, 'SESSION_EXPIRED')
  }
  if(now - session.lastActivityAt.getTime() > sessionConfig.idleTimeoutMs){
    await revokeSession(session, 'idle')
    throw new AppError(`You were logged out after ${idleMinutes} minutes of inactivity. Please log in again.`, 401, 'SESSION_IDLE')
  }
}

async function loadActiveAccount(session){
  const user = await User.findById(session.userId).lean()
  if(!user || user.status !== 'Active'){
    await revokeSession(session, 'user_inactive')
    throw new AppError('Your account is inactive. Contact your administrator.', 403, 'USER_INACTIVE')
  }

  let tenant = null
  if(user.role !== 'SUPER_ADMIN'){
    tenant = await Tenant.findById(user.tenantId).lean()
    if(!tenant || tenant.status !== 'Active'){
      await revokeSession(session, 'tenant_inactive')
      throw new AppError('Your company account is not active. Contact Cliently for support.', 403, 'TENANT_INACTIVE')
    }
  }

  return {user, tenant}
}

async function rotateRefreshToken(session){
  const refreshToken = generateRefreshToken()
  session.refreshTokenHash = hashToken(refreshToken)
  await session.save()
  return refreshToken
}

function toProfile(user, tenant) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    tenantId: tenant ? tenant._id : null,
    company: tenant ? { id: tenant._id, name: tenant.companyName, slug: tenant.slug } : null,
    employeeId: user.employeeId || null,
    lastLoginAt: user.lastLoginAt || null
  }
}

module.exports = {
  issueAccessToken,
  createSession,
  findSessionByRefreshToken,
  revokeSession,
  checkSession,
  loadActiveAccount,
  rotateRefreshToken,
  toProfile
}