const jwt = require('jsonwebtoken')
const { sessionConfig } = require('../config/session')

const PORTAL_AUDIENCE = 'cliently-portal'

function signCustomerToken({ accountId, sessionId, tenantId, customerId }) {
  return jwt.sign(
    { sid: String(sessionId), typ: 'customer', tenantId: String(tenantId), customerId: String(customerId) },
    sessionConfig.accessTokenSecret,
    {
      subject: String(accountId),
      expiresIn: sessionConfig.accessTokenTtlSeconds,
      issuer: sessionConfig.issuer,
      audience: PORTAL_AUDIENCE,
      algorithm: 'HS256'
    }
  )
}

function verifyCustomerToken(token) {
  const payload = jwt.verify(token, sessionConfig.accessTokenSecret, {
    issuer: sessionConfig.issuer,
    audience: PORTAL_AUDIENCE,
    algorithms: ['HS256']
  })
  if (payload.typ !== 'customer') throw new jwt.JsonWebTokenError('Wrong token type')
  return payload
}

module.exports = { signCustomerToken, verifyCustomerToken }