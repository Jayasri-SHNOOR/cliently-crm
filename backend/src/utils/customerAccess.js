const crypto = require('crypto')
const CustomerAccount = require('../models/CustomerAccount')
const Tenant = require('../models/Tenant')
const { generateLoginId } = require('./loginId')

const ACTIVATION_HOURS = 48

function hashToken(token) {
  return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function activationLink(slug, token) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '')
  return `${base}/site/${encodeURIComponent(slug)}/activate?token=${token}`
}

async function createAccount(tenantId, customerId, issuedBy) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await CustomerAccount.create({
        tenantId,
        customerId,
        loginId: generateLoginId(),
        issuedBy
      })
    } catch (err) {
      if (err.code !== 11000) throw err
      const existing = await CustomerAccount.findOne({ tenantId, customerId })
      if (existing) return existing
    }
  }
  throw new Error('Could not create a unique login ID. Please try again.')
}

async function issuePortalAccess({ tenantId, customerId, issuedBy = null }) {
  const tenant = await Tenant.findById(tenantId).select('slug').lean()
  if (!tenant?.slug) throw new Error('Company website address is missing')

  let account = await CustomerAccount.findOne({ tenantId, customerId })
  if (!account) account = await createAccount(tenantId, customerId, issuedBy)

  if (account.status === 'Disabled') {
    const err = new Error('Portal access for this customer is disabled')
    err.statusCode = 400
    throw err
  }

  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + ACTIVATION_HOURS * 60 * 60 * 1000)

  await CustomerAccount.updateOne(
    { _id: account._id },
    { $set: { activationTokenHash: hashToken(token), activationExpiresAt: expiresAt, issuedBy } }
  )

  return {
    loginId: account.loginId,
    status: account.status,
    activationLink: activationLink(tenant.slug, token),
    expiresAt
  }
}

module.exports = { issuePortalAccess, hashToken, ACTIVATION_HOURS }