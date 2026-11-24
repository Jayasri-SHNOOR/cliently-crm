const crypto = require('crypto')
const { promisify } = require('util')

const scrypt = promisify(crypto.scrypt)
const N = 16384
const R = 8
const P = 1
const KEY_LENGTH = 64
const DUMMY_HASH = `scrypt$${N}$${R}$${P}$${'A'.repeat(22)}$${'A'.repeat(86)}`

function checkPasswordRules(password) {
  if (typeof password !== 'string') return 'Password is required'
  if (password.length < 8) return 'Password must be at least 8 characters'
  if (password.length > 128) return 'Password must be 128 characters or less'
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number'
  }
  return ''
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = await scrypt(password, salt, KEY_LENGTH, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

async function verifyPassword(password, stored) {
  const parts = String(stored || DUMMY_HASH).split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, n, r, p, saltText, keyText] = parts
  const expected = Buffer.from(keyText, 'base64url')
  const key = await scrypt(String(password || ''), Buffer.from(saltText, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p)
  })
  return Boolean(stored) && key.length === expected.length && crypto.timingSafeEqual(key, expected)
}

module.exports = { checkPasswordRules, hashPassword, verifyPassword }