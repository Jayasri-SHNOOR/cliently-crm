const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5
const MAX_KEYS = 10000
const hits = new Map()

function prune(now) {
  for (const [key, times] of hits) {
    const recent = times.filter((time) => now - time < WINDOW_MS)
    if (recent.length === 0) {
      hits.delete(key)
    } else {
      hits.set(key, recent)
    }
  }
}

function enquiryLimiter(req, res, next) {
  const now = Date.now()
  if (hits.size > MAX_KEYS) {
    prune(now)
  }

  const key = `${req.ip}|${req.params.slug}`
  const recent = (hits.get(key) || []).filter((time) => now - time < WINDOW_MS)

  if (recent.length >= MAX_PER_WINDOW) {
    const retryAfter = Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)
    res.set('Retry-After', String(retryAfter))
    return res.status(429).json({
      message: 'Too many enquiries. Please try again later.',
      code: 'ENQUIRY_RATE_LIMITED'
    })
  }

  recent.push(now)
  hits.set(key, recent)
  next()
}

module.exports = enquiryLimiter