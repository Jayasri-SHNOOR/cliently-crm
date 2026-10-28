function createSlidingWindowLimiter({windowMs, limit}){
    const entries = new Map()
    function windowStartFor(now){
      return Math.floor(now / windowMs) * windowMs
    }
  
    function getEntry(key, windowStart){
      const entry = entries.get(key)
      if(!entry || entry.windowStart < windowStart - windowMs){
        const fresh ={windowStart, previous: 0, current: 0}
        entries.set(key, fresh)
        return fresh
      }
  
      if(entry.windowStart === windowStart - windowMs){
        entry.previous = entry.current
        entry.current = 0
        entry.windowStart = windowStart
      }
      return entry
    }
  
    function estimateUsed(entry, now){
      const elapsed = now - entry.windowStart
      const previousWeight = (windowMs - elapsed) / windowMs
      return entry.previous * previousWeight + entry.current
    }
  
    function msUntilAllowed(entry, now){
      if(entry.current + 1 <= limit){
        const neededWeight = (limit - entry.current - 1) / entry.previous
        const allowedAt = entry.windowStart + windowMs * (1 - neededWeight)
        return Math.max(0, allowedAt - now)
      }
  
      const neededWeight = (limit - 1) / entry.current
      const allowedAt = entry.windowStart + windowMs + windowMs * (1 - neededWeight)
      return Math.max(0, allowedAt - now)
    }
  
    function hit(key, now = Date.now()){
      const entry = getEntry(key, windowStartFor(now))
      const used = estimateUsed(entry, now)
  
      if (used + 1 > limit){
        return {allowed: false, limit, remaining: 0, retryAfterMs: msUntilAllowed(entry, now)}
      }
  
      entry.current += 1
      return {
        allowed: true,
        limit,
        remaining: Math.max(0, Math.floor(limit - used - 1)),
        retryAfterMs: 0
      }
    }

    function release(key){
        const entry = entries.get(key)
        if (entry && entry.current > 0) {
          entry.current -= 1
        }
      }
  
    function cleanup(now = Date.now()){
      const oldestUseful = windowStartFor(now) - windowMs
      for (const [key, entry] of entries){
        if (entry.windowStart < oldestUseful){
          entries.delete(key)
        }
      }
    }
  
    const timer = setInterval(cleanup, windowMs)
    timer.unref()
  
    return{
      hit,
      release,
      cleanup,
      reset: (key) => entries.delete(key),
      size: () => entries.size,
      stop: () => clearInterval(timer)
    }
  }
  
  module.exports = {createSlidingWindowLimiter}