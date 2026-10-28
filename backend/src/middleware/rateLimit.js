const {createSlidingWindowLimiter} = require('../utils/rateLimit/slidingWindow')
const AppError = require('../utils/AppError')

function formatWait(seconds){
  if (seconds < 60){
    return `${seconds} second${seconds === 1 ? '' : 's'}`
  }
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

function rateLimit({
  name,
  windowMs,
  limit,
  message,
  countSuccessful = true,
  keyGenerator = (req) => req.ip
}) {
  if (!name || !message) {
    throw new Error('rateLimit needs a name and a message')
  }

  const limiter = createSlidingWindowLimiter({windowMs, limit})
  return function rateLimitMiddleware(req, res, next){
    const key = keyGenerator(req)
    const result = limiter.hit(key)
    res.set('RateLimit-Limit', String(result.limit))
    res.set('RateLimit-Remaining', String(result.remaining))
    if(!result.allowed){
      const retryAfterSeconds = Math.max(1, Math.ceil(result.retryAfterMs / 1000))
      res.set('Retry-After', String(retryAfterSeconds))
      console.warn(`[rate-limit] ${name} blocked ${key} for ${retryAfterSeconds}s`)
      return next(new AppError(`${message} Please try again in ${formatWait(retryAfterSeconds)}.`, 429))
    }

    if(!countSuccessful){
      res.on('finish', () => {
        if(res.statusCode < 400){
          limiter.release(key)
        }
      })
    }
    next()
  }
}

module.exports = rateLimit