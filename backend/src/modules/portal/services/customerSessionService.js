const CustomerSession = require('../../../models/CustomerSession')
const CustomerAccount = require('../../../models/CustomerAccount')
const Customer = require('../../../models/Customer')
const Tenant = require('../../../models/Tenant')
const AppError = require('../../../utils/AppError')
const { sessionConfig } = require('../../../config/session')
const { generateRefreshToken, hashToken } = require('../../../utils/tokens')
const { signCustomerToken } = require('../../../utils/customerTokens')

const COOKIE_NAME = 'cliently_cust_rt'
const COOKIE_PATH = '/api/portal/auth'

function fail(message, status, code) {
  const err = new AppError(message, status, code)
  err.code = code
  return err
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: COOKIE_PATH
  }
}

function issueAccessToken(session) {
  return signCustomerToken({
    accountId: session.accountId,
    sessionId: session._id,
    tenantId: session.tenantId,
    customerId: session.customerId
  })
}

async function createSession(account, req) {
  const now = new Date()
  const refreshToken = generateRefreshToken()
  const session = await CustomerSession.create({
    accountId: account._id,
    customerId: account.customerId,
    tenantId: account.tenantId,
    refreshTokenHash: hashToken(refreshToken),
    lastActivityAt: now,
    expiresAt: new Date(now.getTime() + sessionConfig.absoluteTimeoutMs),
    userAgent: (req.get('user-agent') || '').slice(0, 300),
    ip: req.ip
  })
  return { session, refreshToken, accessToken: issueAccessToken(session) }
}

async function findByRefreshToken(refreshToken) {
  if (!refreshToken) return null
  return CustomerSession.findOne({ refreshTokenHash: hashToken(refreshToken) })
}

async function revokeSession(session, reason) {
  if (!session || session.revokedAt) return
  await CustomerSession.updateOne(
    { _id: session._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  )
  session.revokedAt = new Date()
}

async function revokeAllForAccount(accountId, reason) {
  await CustomerSession.updateMany(
    { accountId, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  )
}

async function checkSession(session, now = Date.now()) {
  if (!session || session.revokedAt) {
    throw fail('Your session has ended. Please log in again.', 401, 'SESSION_REVOKED')
  }
  if (session.expiresAt.getTime() <= now) {
    await revokeSession(session, 'expired')
    throw fail('Your session has expired. Please log in again.', 401, 'SESSION_EXPIRED')
  }
  if (now - session.lastActivityAt.getTime() > sessionConfig.idleTimeoutMs) {
    await revokeSession(session, 'idle')
    throw fail('You were logged out after a period of inactivity. Please log in again.', 401, 'SESSION_IDLE')
  }
}

async function loadAccount(session) {
  const [account, customer, tenant] = await Promise.all([
    CustomerAccount.findOne({ _id: session.accountId, tenantId: session.tenantId }).lean(),
    Customer.findOne({ _id: session.customerId, tenantId: session.tenantId }).lean(),
    Tenant.findById(session.tenantId).lean()
  ])

  if (!tenant || tenant.status !== 'Active') {
    await revokeSession(session, 'tenant_inactive')
    throw fail('This portal is not available right now.', 403, 'TENANT_INACTIVE')
  }
  if (!account || account.status !== 'Active' || !customer || customer.status === 'Inactive') {
    await revokeSession(session, 'account_inactive')
    throw fail('Your account is not active. Please contact us.', 403, 'ACCOUNT_INACTIVE')
  }
  return { account, customer, tenant }
}

async function touchActivity(session, now = Date.now()) {
  if (now - session.lastActivityAt.getTime() < sessionConfig.activityWriteIntervalMs) return
  await CustomerSession.updateOne(
    { _id: session._id, revokedAt: null },
    { $set: { lastActivityAt: new Date(now) } }
  )
}

async function rotateRefreshToken(session) {
  const refreshToken = generateRefreshToken()
  await CustomerSession.updateOne(
    { _id: session._id },
    { $set: { refreshTokenHash: hashToken(refreshToken), lastActivityAt: new Date() } }
  )
  return refreshToken
}

function toProfile(account, customer, tenant) {
  return {
    loginId: account.loginId,
    customerCode: customer.customerCode || '',
    name: customer.name,
    email: customer.email || '',
    phone: customer.phone || '',
    address: customer.address || '',
    city: customer.city || '',
    lastLoginAt: account.lastLoginAt || null,
    company: { name: tenant.companyName, slug: tenant.slug }
  }
}

module.exports = {
  COOKIE_NAME,
  cookieOptions,
  fail,
  issueAccessToken,
  createSession,
  findByRefreshToken,
  revokeSession,
  revokeAllForAccount,
  checkSession,
  loadAccount,
  touchActivity,
  rotateRefreshToken,
  toProfile
}