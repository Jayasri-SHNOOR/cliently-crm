const {createTokenBucketLimiter} = require('../utils/rateLimit/tokenBucket')
const AppError = require('../utils/AppError')

function userKey(req){
  if (!req.user || !req.user.tenantId){
    throw new Error('tokenBucketLimit must run after requireAuth')
  }
  return `${req.user.tenantId}:${req.user.id || req.ip}`
}

function tokenBucketLimit({
  name,
  capacity,
  refillPerSecond,
  costs = {},
  defaultCost = 1,
  message,
  keyGenerator = userKey
}){
  if(!name || !message){
    throw new Error('tokenBucketLimit needs a name and a message')
  }

  const allCosts = {...costs, default: defaultCost}
  for(const [method, cost] of Object.entries(allCosts)){
    if (!(cost > 0) || cost > capacity){
      throw new Error(`tokenBucketLimit: cost for ${method} must be between 1 and ${capacity}`)
    }
  }

  const limiter = createTokenBucketLimiter({capacity, refillPerSecond})
  return function tokenBucketMiddleware(req, res, next){
    try{
      const key = keyGenerator(req)
      const cost = costs[req.method] ?? defaultCost
      const result = limiter.take(key, cost)
      res.set('RateLimit-Limit', String(result.limit))
      res.set('RateLimit-Remaining', String(result.remaining))
      if(!result.allowed){
        const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000))
        const unit = retryAfterSeconds === 1 ? 'second' : 'seconds'
        res.set('Retry-After', String(retryAfterSeconds))
        console.warn(`[rate-limit] ${name} blocked ${key} (${req.method}, cost ${cost}) for ${retryAfterSeconds}s`)
        return next(new AppError(`${message} Please wait ${retryAfterSeconds} ${unit} and try again.`, 429))
      }
      next()
    }catch(err){
      next(err)
    }
  }
}

module.exports = tokenBucketLimit