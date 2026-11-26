const { createTokenBucketLimiter } = require('../utils/rateLimit/tokenBucket')
const T0 = 1000000
const at = (seconds) => T0 + seconds * 1000

const bucket = createTokenBucketLimiter({ capacity: 5, refillPerSecond: 1 })

function show(label, result) {
  const status = result.allowed ? 'ALLOWED' : 'BLOCKED'
  const wait = result.allowed ? '' : `  retry in ${Math.ceil(result.retryAfterMs / 1000)}s`
  console.log(`${label.padEnd(34)} ${status}  tokens left=${result.remaining}${wait}`)
}

console.log('Capacity 5 tokens, refill 1 token per second. GET = 1 token, POST = 3 tokens\n')

show('GET #1 (+0s)', bucket.take('user-A', 1, at(0)))
show('GET #2 (+0s)', bucket.take('user-A', 1, at(0)))
show('GET #3 (+0s)', bucket.take('user-A', 1, at(0)))
show('GET #4 (+0s)', bucket.take('user-A', 1, at(0)))
show('GET #5 (+0s)', bucket.take('user-A', 1, at(0)))
show('GET #6 (+0s)', bucket.take('user-A', 1, at(0)))
show('Other user GET (+0s)', bucket.take('user-B', 1, at(0)))
show('GET after 1 second (+1s)', bucket.take('user-A', 1, at(1)))
show('POST costs 3 (+2s)', bucket.take('user-A', 3, at(2)))
show('POST after waiting (+4s)', bucket.take('user-A', 3, at(4)))
show('GET after a long break (+60s)', bucket.take('user-A', 1, at(60)))

console.log(`\nBuckets stored: ${bucket.size()}`)
bucket.cleanup(at(60.5))
console.log(`After cleanup at +60.5s: ${bucket.size()}`)
bucket.cleanup(at(120))
console.log(`After cleanup at +120s: ${bucket.size()}`)

try {
  createTokenBucketLimiter({ capacity: 0, refillPerSecond: 1 })
} catch (err) {
  console.log(`\nBad config check: ${err.message}`)
}

try {
  bucket.take('user-A', 10, at(130))
} catch (err) {
  console.log(`Bad cost check: ${err.message}`)
}

bucket.stop()