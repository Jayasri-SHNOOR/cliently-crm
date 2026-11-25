const mongoose = require('mongoose')
const Customer = require('../../../models/Customer')
const CustomerProduct = require('../../../models/CustomerProduct')
const ServiceRequest = require('../../../models/ServiceRequest')
const nextSequence = require('../../../utils/nextSequence')
const { SERVICE_TYPES } = ServiceRequest
const { OPEN_STATUSES, fail, text, optionalDate, startOfToday, formatRequest } = require('../../customer-care/helpers')

function own(req) {
  return { tenantId: req.customer.tenantId, customerId: req.customer.customerId }
}

async function listProducts(req, res, next) {
  try {
    const [products, open] = await Promise.all([
      CustomerProduct.find(own(req)).sort({ createdAt: -1 }).lean(),
      ServiceRequest.find({ ...own(req), status: { $in: OPEN_STATUSES } }).select('customerProductId').lean()
    ])
    const openIds = new Set(open.map((r) => String(r.customerProductId)))
    const now = new Date()

    res.json({
      products: products.map((p) => ({
        id: p._id,
        productName: p.productName,
        serialNumber: p.serialNumber,
        purchaseDate: p.purchaseDate,
        warrantyUntil: p.warrantyUntil,
        underWarranty: Boolean(p.warrantyUntil && p.warrantyUntil > now),
        hasOpenRequest: openIds.has(String(p._id))
      }))
    })
  } catch (err) {
    next(err)
  }
}

function serviceTypes(req, res) {
  res.json({ serviceTypes: SERVICE_TYPES })
}

async function createRequest(req, res, next) {
  try {
    const serviceType = text(req.body.serviceType, 40)
    if (!SERVICE_TYPES.includes(serviceType)) {
      throw fail(`Service type must be one of: ${SERVICE_TYPES.join(', ')}`)
    }

    let product = null
    if (req.body.customerProductId) {
      if (!mongoose.isValidObjectId(req.body.customerProductId)) throw fail('Invalid product')
      product = await CustomerProduct.findOne({ ...own(req), _id: req.body.customerProductId }).lean()
      if (!product) throw fail('Product not found', 404)

      const duplicate = await ServiceRequest.exists({
        ...own(req),
        customerProductId: product._id,
        serviceType,
        status: { $in: OPEN_STATUSES }
      })
      if (duplicate) throw fail(`You already have an open ${serviceType.toLowerCase()} request for this product`, 409)
    }

    const preferredDate = optionalDate(req.body.preferredDate, 'preferred date')
    if (preferredDate && preferredDate < startOfToday()) throw fail('Preferred date cannot be in the past')

    const description = text(req.body.description, 1000)
    if (serviceType === 'Other' && !description) throw fail('Please describe what you need')

    const customer = await Customer.findOne({ _id: req.customer.customerId, tenantId: req.customer.tenantId })
      .select('address city salesExecId')
      .lean()

    const seq = await nextSequence(`service:${req.customer.tenantId}`)
    const request = new ServiceRequest({
      ...own(req),
      requestNumber: `SR-${String(seq).padStart(4, '0')}`,
      customerProductId: product?._id || null,
      productName: product?.productName || '',
      serviceType,
      description,
      preferredDate,
      address: text(req.body.address, 300) || [customer?.address, customer?.city].filter(Boolean).join(', '),
      salesExecId: customer?.salesExecId || null
    })
    request.updates.push({ status: 'Requested', note: 'Request received', byName: req.customer.profile.name, byRole: 'CUSTOMER' })
    await request.save()

    res.status(201).json({
      message: `Request ${request.requestNumber} submitted. We'll assign a technician soon.`,
      serviceRequest: formatRequest(request, { forCustomer: true })
    })
  } catch (err) {
    next(err)
  }
}

async function listRequests(req, res, next) {
  try {
    const requests = await ServiceRequest.find(own(req)).sort({ createdAt: -1 }).limit(100).lean()
    res.json({ count: requests.length, serviceRequests: requests.map((r) => formatRequest(r, { forCustomer: true })) })
  } catch (err) {
    next(err)
  }
}

async function findOwnRequest(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw fail('Service request not found', 404)
  const request = await ServiceRequest.findOne({ ...own(req), _id: req.params.id })
  if (!request) throw fail('Service request not found', 404)
  return request
}

async function getRequest(req, res, next) {
  try {
    const request = await findOwnRequest(req)
    res.json({ serviceRequest: formatRequest(request, { forCustomer: true }) })
  } catch (err) {
    next(err)
  }
}

async function cancelRequest(req, res, next) {
  try {
    const request = await findOwnRequest(req)
    if (!['Requested', 'Assigned'].includes(request.status)) {
      throw fail(`A request that is ${request.status.toLowerCase()} cannot be cancelled`)
    }
    request.status = 'Cancelled'
    request.updates.push({
      status: 'Cancelled',
      note: text(req.body.reason, 500) || 'Cancelled by customer',
      byName: req.customer.profile.name,
      byRole: 'CUSTOMER'
    })
    await request.save()
    res.json({ message: `Request ${request.requestNumber} cancelled`, serviceRequest: formatRequest(request, { forCustomer: true }) })
  } catch (err) {
    next(err)
  }
}

module.exports = { listProducts, serviceTypes, createRequest, listRequests, getRequest, cancelRequest }