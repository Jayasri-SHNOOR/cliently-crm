const rateLimit = require('./rateLimit')
const tokenBucketLimit = require('./tokenBucketLimit')
const limits = require('../config/rateLimits')
const ipShield = rateLimit({ name: 'ipShield', ...limits.ipShield })
const authLimiter = rateLimit({ name: 'auth', ...limits.auth })
const userLimiter = tokenBucketLimit({ name: 'user', ...limits.user })

module.exports = { ipShield, authLimiter, userLimiter }