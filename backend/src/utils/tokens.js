const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { sessionConfig } = require('../config/session')

function signAccessToken({userId, sessionId, role, tenantId}){
  return jwt.sign(
    {
      sid: String(sessionId),
      role,
      tenantId: tenantId ? String(tenantId) : null
    },
    sessionConfig.accessTokenSecret,
    {
      subject: String(userId),
      expiresIn: sessionConfig.accessTokenTtlSeconds,
      issuer: sessionConfig.issuer,
      audience: sessionConfig.audience,
      algorithm: 'HS256'
    }
  )
}

function verifyAccessToken(token){
  return jwt.verify(token, sessionConfig.accessTokenSecret, {
    issuer: sessionConfig.issuer,
    audience: sessionConfig.audience,
    algorithms: ['HS256']
  })
}

function generateRefreshToken(){
  return crypto.randomBytes(48).toString('base64url')
}

function hashToken(token){
  return crypto.createHash('sha256').update(token).digest('hex')
}

module.exports = {signAccessToken, verifyAccessToken, generateRefreshToken, hashToken}