const crypto = require('crypto')

const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function generateLoginId() {
  let raw = ''
  for (let i = 0; i < 8; i++) {
    raw += ALPHABET[crypto.randomInt(ALPHABET.length)]
  }
  return `${raw.slice(0, 4)}-${raw.slice(4)}`
}

function normalizeLoginId(value) {
  const clean = String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (clean.length !== 8) return ''
  return `${clean.slice(0, 4)}-${clean.slice(4)}`
}

module.exports = { generateLoginId, normalizeLoginId }