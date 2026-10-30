process.env.JWT_ACCESS_SECRET = 'test-secret-that-is-long-enough-for-hs256-0123456789'
process.env.ACCESS_TOKEN_TTL_SECONDS = '1'

const jwt = require('jsonwebtoken')
const {signAccessToken, verifyAccessToken, generateRefreshToken, hashToken} = require('../utils/tokens')
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function tryVerify(label, token){
  try{
    const payload = verifyAccessToken(token)
    console.log(`${label.padEnd(22)} VALID  sub=${payload.sub} sid=${payload.sid} role=${payload.role}`)
  }catch(err){
    console.log(`${label.padEnd(22)} REJECTED  ${err.name}: ${err.message}`)
  }
}

async function main() {
  const token = signAccessToken({ userId: 'user123', sessionId: 'session456', role: 'CLIENT_ADMIN', tenantId: 'tenant789' })
  console.log('Token has', token.split('.').length, 'parts')
  console.log('Payload anyone can read:', jwt.decode(token))
  console.log()
  tryVerify('Fresh token', token)

  const [header, , signature] = token.split('.')
  const fakePayload = Buffer.from(JSON.stringify({ ...jwt.decode(token), role: 'SUPER_ADMIN' })).toString('base64url')
  tryVerify('Role changed by hand', `${header}.${fakePayload}.${signature}`)

  const otherSecretToken = jwt.sign({ sid: 'x' }, 'a-different-secret-of-sufficient-length-000', {
    subject: 'user123',
    issuer: 'cliently-crm',
    audience: 'cliently-web',
    expiresIn: 60
  })
  tryVerify('Signed with wrong key', otherSecretToken)

  await wait(1500)
  tryVerify('After 1.5 seconds', token)

  console.log()
  const refreshA = generateRefreshToken()
  const refreshB = generateRefreshToken()
  console.log('Refresh token length:', refreshA.length)
  console.log('Two refresh tokens differ:', refreshA !== refreshB)
  console.log('Same token, same hash:', hashToken(refreshA) === hashToken(refreshA))
  console.log('Hash length:', hashToken(refreshA).length)
}

main()