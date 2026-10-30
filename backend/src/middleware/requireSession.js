const jwt = require('jsonwebtoken')
const Session = require('../models/Session')
const AppError = require('../utils/AppError')
const { sessionConfig } = require('../config/session')
const { verifyAccessToken } = require('../utils/tokens')
const sessionService = require('../modules/auth/services/sessionService')

function readBearerToken(req) {
  const header = req.get('authorization') || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Please log in.', 401, 'NO_TOKEN')
  }
  return token
}

function decodeAccessToken(token) {
  try {
    return verifyAccessToken(token)
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError('Your access token has expired.', 401, 'TOKEN_EXPIRED')
    }
    throw new AppError('Invalid access token. Please log in again.', 401, 'INVALID_TOKEN')
  }
}

function sameValue(a, b) {
  return String(a || '') === String(b || '')
}

async function touchActivity(session, now) {
  if (now - session.lastActivityAt.getTime() < sessionConfig.activityWriteIntervalMs) {
    return
  }
  await Session.updateOne(
    { _id: session._id, revokedAt: null },
    { $set: { lastActivityAt: new Date(now) } }
  )
}

async function requireSession(req, res, next) {
  try {
    const payload = decodeAccessToken(readBearerToken(req))

    const session = await Session.findById(payload.sid)
    if (session && !sameValue(session.userId, payload.sub)) {
      throw new AppError('Invalid access token. Please log in again.', 401, 'INVALID_TOKEN')
    }

    const now = Date.now()
    await sessionService.checkSession(session, now)
    const { user, tenant } = await sessionService.loadActiveAccount(session)

    if (user.role !== payload.role || !sameValue(user.tenantId, payload.tenantId)) {
      await sessionService.revokeSession(session, 'role_changed')
      throw new AppError('Your access has changed. Please log in again.', 401, 'SESSION_REVOKED')
    }

    await touchActivity(session, now)

    req.user = sessionService.toProfile(user, tenant)
    req.authSession = { id: session._id, expiresAt: session.expiresAt }
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = requireSession