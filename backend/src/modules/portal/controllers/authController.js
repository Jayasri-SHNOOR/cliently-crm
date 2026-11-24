const CustomerAccount = require('../../../models/CustomerAccount')
const Customer = require('../../../models/Customer')
const Tenant = require('../../../models/Tenant')
const { hashToken } = require('../../../utils/customerAccess')
const { normalizeLoginId } = require('../../../utils/loginId')
const { checkPasswordRules, hashPassword, verifyPassword } = require('../../../utils/password')
const service = require('../services/customerSessionService')

const SLUG_PATTERN = /^[a-z0-9-]{2,60}$/
const MAX_FAILED = 5
const LOCK_MINUTES = 15
const INVALID_LOGIN = 'Invalid login ID or password'
const INVALID_LINK = 'This link is invalid or has expired. Please ask us for a new one.'

function text(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function findTenant(slugValue) {
  const slug = text(slugValue).toLowerCase()
  if (!SLUG_PATTERN.test(slug)) return null
  return Tenant.findOne({ slug, status: 'Active' }).lean()
}

function sendSession(res, { accessToken, refreshToken }, profile) {
  res.cookie(service.COOKIE_NAME, refreshToken, service.cookieOptions())
  res.json({ accessToken, customer: profile })
}

async function findByActivationToken(slug, token) {
  const tokenText = text(token)
  if (tokenText.length < 20 || tokenText.length > 100) return null

  const tenant = await findTenant(slug)
  if (!tenant) return null

  const account = await CustomerAccount.findOne({
    tenantId: tenant._id,
    activationTokenHash: hashToken(tokenText)
  })
  if (!account || account.status === 'Disabled') return null
  if (!account.activationExpiresAt || account.activationExpiresAt.getTime() < Date.now()) return null

  const customer = await Customer.findOne({ _id: account.customerId, tenantId: tenant._id }).lean()
  if (!customer || customer.status === 'Inactive') return null

  return { tenant, account, customer, tokenHash: hashToken(tokenText) }
}

async function checkActivation(req, res, next) {
  try {
    const found = await findByActivationToken(req.body.slug, req.body.token)
    if (!found) throw service.fail(INVALID_LINK, 400, 'INVALID_LINK')

    res.json({
      loginId: found.account.loginId,
      name: found.customer.name,
      companyName: found.tenant.companyName,
      mode: found.account.status === 'Active' ? 'reset' : 'activate'
    })
  } catch (err) {
    next(err)
  }
}

async function activate(req, res, next) {
  try {
    const found = await findByActivationToken(req.body.slug, req.body.token)
    if (!found) throw service.fail(INVALID_LINK, 400, 'INVALID_LINK')

    const rule = checkPasswordRules(req.body.password)
    if (rule) throw service.fail(rule, 400, 'WEAK_PASSWORD')

    const passwordHash = await hashPassword(req.body.password)
    const updated = await CustomerAccount.findOneAndUpdate(
      { _id: found.account._id, activationTokenHash: found.tokenHash },
      {
        $set: {
          passwordHash,
          status: 'Active',
          passwordChangedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
          activationTokenHash: null,
          activationExpiresAt: null
        }
      },
      { returnDocument: 'after' }
    )
    if (!updated) throw service.fail(INVALID_LINK, 400, 'INVALID_LINK')

    await service.revokeAllForAccount(updated._id, 'password_changed')

    res.json({ message: 'Your password is set. You can now log in.', loginId: updated.loginId })
  } catch (err) {
    next(err)
  }
}

async function login(req, res, next) {
  try {
    const loginId = normalizeLoginId(req.body.loginId)
    const password = typeof req.body.password === 'string' ? req.body.password : ''
    const tenant = await findTenant(req.body.slug)

    const account = tenant && loginId
      ? await CustomerAccount.findOne({ tenantId: tenant._id, loginId }).select('+passwordHash')
      : null

    if (account?.lockedUntil && account.lockedUntil.getTime() > Date.now()) {
      const seconds = Math.ceil((account.lockedUntil.getTime() - Date.now()) / 1000)
      res.set('Retry-After', String(seconds))
      throw service.fail('Too many failed attempts. Please try again later.', 429, 'ACCOUNT_LOCKED')
    }

    const passwordOk = await verifyPassword(password, account?.passwordHash)

    if (!account || !passwordOk || account.status !== 'Active') {
      if (account && !passwordOk) {
        const failedAttempts = (account.failedAttempts || 0) + 1
        const update = { failedAttempts }
        if (failedAttempts >= MAX_FAILED) {
          update.failedAttempts = 0
          update.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
        }
        await CustomerAccount.updateOne({ _id: account._id }, { $set: update })
      }
      throw service.fail(INVALID_LOGIN, 401, 'INVALID_LOGIN')
    }

    const customer = await Customer.findOne({ _id: account.customerId, tenantId: tenant._id }).lean()
    if (!customer || customer.status === 'Inactive') {
      throw service.fail('Your account is not active. Please contact us.', 403, 'ACCOUNT_INACTIVE')
    }

    const lastLoginAt = new Date()
    await CustomerAccount.updateOne(
      { _id: account._id },
      { $set: { failedAttempts: 0, lockedUntil: null, lastLoginAt } }
    )

    const created = await service.createSession(account, req)
    sendSession(res, created, service.toProfile({ ...account.toObject(), lastLoginAt }, customer, tenant))
  } catch (err) {
    next(err)
  }
}

async function refresh(req, res, next) {
  try {
    const presented = req.cookies?.[service.COOKIE_NAME]
    if (!presented) return res.status(204).end()

    const session = await service.findByRefreshToken(presented)
    await service.checkSession(session)
    const { account, customer, tenant } = await service.loadAccount(session)
    const refreshToken = await service.rotateRefreshToken(session)

    sendSession(
      res,
      { accessToken: service.issueAccessToken(session), refreshToken },
      service.toProfile(account, customer, tenant)
    )
  } catch (err) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      res.clearCookie(service.COOKIE_NAME, service.cookieOptions())
    }
    next(err)
  }
}

async function logout(req, res, next) {
  try {
    const session = await service.findByRefreshToken(req.cookies?.[service.COOKIE_NAME])
    await service.revokeSession(session, 'logout')
    res.clearCookie(service.COOKIE_NAME, service.cookieOptions())
    res.json({ message: 'Logged out' })
  } catch (err) {
    next(err)
  }
}

function me(req, res) {
  res.json({ customer: req.customer.profile })
}

module.exports = { checkActivation, activate, login, refresh, logout, me }