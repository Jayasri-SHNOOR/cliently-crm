
const Tenant = require('../../../models/Tenant')
const Invoice = require('../../../models/Invoice')
const PLANS = require('../../../config/plans')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const {getSeatUsage} = require('../../../utils/seats')
const COMPANY_FIELDS = ['companyName', 'email', 'phone', 'website', 'industry', 'address']
const UPI_PATTERN = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/

function formatCompany(tenant) {
  return{
    companyName: tenant.companyName,
    email: tenant.email || '',
    phone: tenant.phone || '',
    website: tenant.website || '',
    industry: tenant.industry || '',
    address: tenant.address || '',
    updatedAt: tenant.updatedAt
  }
}

function formatPaymentMethod(paymentMethod) {
  if (!paymentMethod || !paymentMethod.upiId) return null
  return{ type: paymentMethod.type, upiId: paymentMethod.upiId }
}

function formatInvoice(invoice) {
  return{
    id: invoice._id,
    invoiceNumber: invoice.invoiceNumber,
    date: invoice.issuedAt,
    plan: invoice.plan,
    amount: invoice.amount,
    status: invoice.status
  }
}

function getPlan(planName) {
  const plan = PLANS[planName]
  if(!plan){
    throw new AppError(`Unknown plan: ${planName}`, 500)
  }
  return plan
}

async function getCompany(req, res, next) {
  try{
    const tenant = await Tenant.findById(req.user.tenantId).lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    res.json(formatCompany(tenant))
  }catch(err){
    next(err)
  }
}

async function updateCompany(req, res, next) {
  try{
    const updates = pick(req.body, COMPANY_FIELDS)
    if(Object.keys(updates).length === 0){
      throw new AppError('No valid fields to update', 400)
    }
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      updates,
      { returnDocument: 'after', runValidators: true }
    ).lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    res.json(formatCompany(tenant))
  }catch(err) {
    next(err)
  }
}

async function getBilling(req, res, next) {
  try{
    const {tenantId} = req.user
    const [tenant, seats, invoices] = await Promise.all([
      Tenant.findById(tenantId).lean(),
      getSeatUsage(tenantId),
      Invoice.find({ tenantId }).sort({ issuedAt: -1 }).limit(12).lean()
    ])
    if(!tenant){
      throw new AppError('Company not found', 404)
    }

    const plan = getPlan(tenant.plan)
    res.json({
      plan:{
        name: plan.name,
        description: plan.description,
        price: plan.price,
        billingCycle: plan.billingCycle
      },
      seats,
      nextBillingDate: tenant.nextBillingDate || null,
      paymentMethod: formatPaymentMethod(tenant.paymentMethod),
      invoices: invoices.map(formatInvoice)
    })
  }catch(err) {
    next(err)
  }
}
async function listPlans(req, res, next) {
  try{
    const tenant = await Tenant.findById(req.user.tenantId).select('plan').lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    const plans = Object.values(PLANS).map((plan) => ({
      ...plan,
      current: plan.name === tenant.plan
    }))
    res.json({ plans })
  }catch(err) {
    next(err)
  }
}

async function getInvoice(req, res, next) {
  try{
    const { tenantId } = req.user
    const [invoice, tenant] = await Promise.all([
      Invoice.findOne({ _id: req.params.id, tenantId }).lean(),
      Tenant.findById(tenantId).lean()
    ])
    if(!invoice){
      throw new AppError('Invoice not found', 404)
    }
    res.json({
      ...formatInvoice(invoice),
      periodStart: invoice.periodStart,
      periodEnd: invoice.periodEnd,
      paymentMethod: invoice.paymentMethod,
      billedTo: {
        companyName: tenant.companyName,
        email: tenant.email || '',
        address: tenant.address || ''
      }
    })
  }catch(err) {
    next(err)
  }
}

async function updatePaymentMethod(req, res, next) {
  try {
    const { upiId } = req.body
    if(typeof upiId !== 'string' || !UPI_PATTERN.test(upiId.trim())){
      throw new AppError('Enter a valid UPI ID, for example name@bank', 400)
    }
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { paymentMethod: { type: 'UPI', upiId: upiId.trim() } },
      { returnDocument: 'after', runValidators: true }
    ).lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    res.json({ paymentMethod: formatPaymentMethod(tenant.paymentMethod) })
  }catch(err) {
    next(err)
  }
}

const PUBLIC_SITE_FIELDS = ['enabled', 'tagline', 'about', 'logoUrl', 'showPrices']

function formatPublicSite(tenant) {
  const site = tenant.publicSite || {}
  return {
    slug: tenant.slug,
    url: `/site/${tenant.slug}`,
    enabled: site.enabled !== false,
    tagline: site.tagline || '',
    about: site.about || '',
    logoUrl: site.logoUrl || '',
    showPrices: site.showPrices !== false
  }
}

async function getPublicSite(req, res, next) {
  try {
    const tenant = await Tenant.findById(req.user.tenantId).lean()
    if (!tenant) {
      throw new AppError('Company not found', 404)
    }
    res.json(formatPublicSite(tenant))
  } catch (err) {
    next(err)
  }
}

async function updatePublicSite(req, res, next) {
  try {
    const updates = {}
    PUBLIC_SITE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[`publicSite.${field}`] = req.body[field]
      }
    })

    if (Object.keys(updates).length === 0) {
      throw new AppError('No valid fields to update', 400)
    }
    if (updates['publicSite.enabled'] !== undefined && typeof updates['publicSite.enabled'] !== 'boolean') {
      throw new AppError('enabled must be true or false', 400)
    }
    if (updates['publicSite.showPrices'] !== undefined && typeof updates['publicSite.showPrices'] !== 'boolean') {
      throw new AppError('showPrices must be true or false', 400)
    }
    if (updates['publicSite.logoUrl'] === '') {
      delete updates['publicSite.logoUrl']
      updates.$unset = { 'publicSite.logoUrl': '' }
    }

    const { $unset, ...set } = updates
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { ...(Object.keys(set).length ? { $set: set } : {}), ...($unset ? { $unset } : {}) },
      { returnDocument: 'after', runValidators: true }
    ).lean()

    if (!tenant) {
      throw new AppError('Company not found', 404)
    }
    res.json(formatPublicSite(tenant))
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getCompany,
  updateCompany,
  getBilling,
  listPlans,
  getInvoice,
  updatePaymentMethod,
  getPublicSite,
  updatePublicSite
}