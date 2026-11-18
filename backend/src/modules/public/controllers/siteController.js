const mongoose = require('mongoose')
const Tenant = require('../../../models/Tenant')
const Product = require('../../../models/Product')
const Lead = require('../../../models/Lead')
const AppError = require('../../../utils/AppError')

const SLUG_PATTERN = /^[a-z0-9-]{2,60}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_PATTERN = /^[0-9+()\-\s]{7,20}$/
const CLOSED_LEAD_STATUSES = ['Won', 'Lost']
const MAX_PRODUCTS = 200
const PRODUCT_FIELDS = 'name type category description price billing duration imageUrl'
const THANK_YOU = 'Thank you! Our team will contact you soon.'
const GENERAL_ENQUIRY = 'General enquiry'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

function visibleProductFilter(tenantId) {
  return { tenantId, status: 'Active', showOnWebsite: { $ne: false } }
}

async function findPublicTenant(slugParam) {
  const slug = clean(slugParam).toLowerCase()
  if (!SLUG_PATTERN.test(slug)) {
    throw new AppError('Site not found', 404)
  }

  const tenant = await Tenant.findOne({ slug, status: 'Active' }).lean()
  if (!tenant || tenant.publicSite?.enabled === false) {
    throw new AppError('Site not found', 404)
  }
  return tenant
}

function presentCompany(tenant) {
  const site = tenant.publicSite || {}
  return {
    slug: tenant.slug,
    companyName: tenant.companyName,
    industry: tenant.industry || '',
    email: tenant.email || '',
    phone: tenant.phone || '',
    website: tenant.website || '',
    address: tenant.address || '',
    tagline: site.tagline || '',
    about: site.about || '',
    logoUrl: site.logoUrl || '',
    showPrices: site.showPrices !== false
  }
}

function presentProduct(product, showPrices) {
  return {
    _id: product._id,
    name: product.name,
    type: product.type,
    category: product.category || '',
    description: product.description || '',
    price: showPrices ? product.price : null,
    billing: product.billing || '',
    duration: product.duration || '',
    imageUrl: product.imageUrl || ''
  }
}

async function getSite(req, res, next) {
  try {
    const tenant = await findPublicTenant(req.params.slug)
    const company = presentCompany(tenant)

    const products = await Product.find(visibleProductFilter(tenant._id))
      .select(PRODUCT_FIELDS)
      .sort({ category: 1, name: 1 })
      .collation({ locale: 'en', strength: 2 })
      .limit(MAX_PRODUCTS)
      .lean()

    res.json({
      data: {
        company,
        products: products.map((product) => presentProduct(product, company.showPrices))
      }
    })
  } catch (err) {
    next(err)
  }
}

function validateEnquiry(body) {
  const input = {
    name: clean(body.name),
    email: clean(body.email).toLowerCase(),
    phone: clean(body.phone),
    company: clean(body.company),
    message: clean(body.message),
    productId: clean(body.productId)
  }
  const errors = {}

  if (!input.name) errors.name = 'Name is required'
  else if (input.name.length > 100) errors.name = 'Name must be 100 characters or less'

  if (!input.email) errors.email = 'Email is required'
  else if (input.email.length > 120 || !EMAIL_PATTERN.test(input.email)) errors.email = 'Enter a valid email address'

  if (input.phone && !PHONE_PATTERN.test(input.phone)) errors.phone = 'Enter a valid phone number'

  if (input.company.length > 100) errors.company = 'Company must be 100 characters or less'

  if (input.message.length > 1000) errors.message = 'Message must be 1000 characters or less'

  if (input.productId && !mongoose.isValidObjectId(input.productId)) errors.productId = 'Select a valid product'

  if (body.consent !== true) errors.consent = 'Please agree to be contacted'

  return { input, errors }
}

async function submitEnquiry(req, res, next) {
  try {
    const tenant = await findPublicTenant(req.params.slug)

    if (clean(req.body?.companyWebsite)) {
      return res.status(201).json({ message: THANK_YOU })
    }

    const { input, errors } = validateEnquiry(req.body || {})

    let product = null
    if (input.productId && !errors.productId) {
      product = await Product.findOne({ _id: input.productId, ...visibleProductFilter(tenant._id) })
        .select('name price')
        .lean()
      if (!product) errors.productId = 'Select a valid product'
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: 'Validation failed', errors })
    }

    const now = new Date()
    const enquiry = {
      phone: input.phone || undefined,
      company: input.company || undefined,
      message: input.message || undefined,
      productId: product ? product._id : null,
      productName: product ? product.name : undefined,
      productInterested: product ? product.name : GENERAL_ENQUIRY,
      lastEnquiryAt: now,
      consentAt: now
    }

    const existing = await Lead.findOne({
      tenantId: tenant._id,
      email: input.email,
      status: { $nin: CLOSED_LEAD_STATUSES }
    }).select('_id')

    if (existing) {
      const updates = Object.fromEntries(Object.entries(enquiry).filter(([, value]) => value !== undefined))
      await Lead.updateOne({ _id: existing._id }, { $set: updates, $inc: { enquiryCount: 1 } })
    } else {
      await Lead.create({
        tenantId: tenant._id,
        name: input.name,
        email: input.email,
        status: 'New',
        source: 'Website',
        value: product?.price || 0,
        enquiryCount: 1,
        ...enquiry
      })
    }

    res.status(201).json({ message: THANK_YOU })
  } catch (err) {
    next(err)
  }
}

module.exports = { getSite, submitEnquiry }