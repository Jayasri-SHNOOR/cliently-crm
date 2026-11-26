function createTokenBucketLimiter({capacity, refillPerSecond, cleanupIntervalMs = 60 * 1000}){
    if(!Number.isInteger(capacity) || capacity <= 0){
      throw new Error('Token bucket: capacity must be a positive whole number')
    }
    if(typeof refillPerSecond !== 'number' || !(refillPerSecond > 0)){
      throw new Error('Token bucket: refillPerSecond must be a positive number')
    }

    const buckets = new Map()
    function refill(bucket, now){
      const elapsedSeconds = Math.max(0, now - bucket.lastRefill) / 1000
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSeconds * refillPerSecond)
      bucket.lastRefill = now
    }
  
    function getBucket(key, now){
      let bucket = buckets.get(key)
      if(!bucket){
        bucket = {tokens: capacity, lastRefill: now}
        buckets.set(key, bucket)
      }
      refill(bucket, now)
      return bucket
    }
  
    function take(key, cost = 1, now = Date.now()){
      if(!(cost > 0) || cost > capacity){
        throw new Error(`Token bucket: cost ${cost} must be between 1 and capacity ${capacity}`)
      }
  
      const bucket = getBucket(key, now)
      if (bucket.tokens >= cost){
        bucket.tokens -= cost
        return{
          allowed: true,
          limit: capacity,
          remaining: Math.floor(bucket.tokens),
          retryAfterMs: 0
        }
      }
  
      const missing = cost - bucket.tokens
      return{
        allowed: false,
        limit: capacity,
        remaining: Math.floor(bucket.tokens),
        retryAfterMs: Math.ceil((missing / refillPerSecond) * 1000)
      }
    }
  
    function cleanup(now = Date.now()){
      for (const [key, bucket] of buckets){
        const elapsedSeconds = (now - bucket.lastRefill) / 1000
        if (bucket.tokens + elapsedSeconds * refillPerSecond >= capacity) {
          buckets.delete(key)
        }
      }
    }
  
    const timer = setInterval(cleanup, cleanupIntervalMs)
    timer.unref()
  
    return{
      take,
      cleanup,
      reset: (key) => buckets.delete(key),
      size: () => buckets.size,
      stop: () => clearInterval(timer)
    }
  }
  
module.exports = {createTokenBucketLimiter}