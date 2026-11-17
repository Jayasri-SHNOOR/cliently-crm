
const mongoose = require('mongoose')
const ClientSubscription = require('../../../models/ClientSubscription')
const Product = require('../../../models/Product')

const fail = (message, statusCode = 400) => {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

const getTenantId = req => {
  if (!req.user?.tenantId) {
    throw fail('Tenant information is missing from authentication', 401)
  }

  return req.user.tenantId
}

const normalizeRole = role =>
  String(role || '').toUpperCase().replace(/[\s-]+/g, '_')

const ensureClientAdmin = req => {
  if (normalizeRole(req.user?.role) !== 'CLIENT_ADMIN') {
    throw fail('Only Client Admin can manage subscriptions', 403)
  }
}

const validateObjectId = (id, label = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw fail(`Invalid ${label}`)
  }
}

const listSubscriptions = async (req, res, next) => {
  try {
    ensureClientAdmin(req)
    const tenantId = getTenantId(req)
    const query = { tenantId }

    const { status, search } = req.query

    if (status) {
      const allowedStatuses = [
        'Active',
        'Pending',
        'Expired',
        'Cancelled'
      ]

      if (!allowedStatuses.includes(status)) {
        throw fail('Invalid subscription status')
      }

      query.status = status
    }

    if (search && String(search).trim()) {
      const escaped = String(search)
        .trim()
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      query.$or = [
        { customerName: { $regex: escaped, $options: 'i' } },
        { customerEmail: { $regex: escaped, $options: 'i' } },
        { customerCompany: { $regex: escaped, $options: 'i' } },
        { productName: { $regex: escaped, $options: 'i' } }
      ]
    }

    const page = Math.max(
      1,
      Number.parseInt(req.query.page, 10) || 1
    )

    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    )

    const [subscriptions, total] = await Promise.all([
      ClientSubscription.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ClientSubscription.countDocuments(query)
    ])

    res.status(200).json({
      success: true,
      count: subscriptions.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      subscriptions
    })
  } catch (error) {
    next(error)
  }
}

const getSubscription = async (req, res, next) => {
  try {
    ensureClientAdmin(req)
    const tenantId = getTenantId(req)

    validateObjectId(req.params.id, 'subscription ID')

    const subscription = await ClientSubscription.findOne({
      _id: req.params.id,
      tenantId
    }).lean()

    if (!subscription) {
      throw fail('Subscription not found', 404)
    }

    res.status(200).json({
      success: true,
      subscription
    })
  } catch (error) {
    next(error)
  }
}

const createSubscription = async (req, res, next) => {
  try {
    ensureClientAdmin(req)
    const tenantId = getTenantId(req)

    const {
      customerName,
      customerEmail,
      customerCompany,
      productId,
      productName,
      amount,
      billingCycle,
      startDate,
      nextBillingDate,
      endDate,
      status,
      notes
    } = req.body

    if (!String(customerName || '').trim()) {
      throw fail('Customer name is required')
    }

    if (!String(customerEmail || '').trim()) {
      throw fail('Customer email is required')
    }

    const email = String(customerEmail).trim().toLowerCase()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw fail('Enter a valid customer email address')
    }

    const validCycles = ['Monthly', 'Yearly', 'One-time']

    if (billingCycle && !validCycles.includes(billingCycle)) {
      throw fail('Invalid billing cycle')
    }

    const validStatuses = [
      'Active',
      'Pending',
      'Expired',
      'Cancelled'
    ]

    if (status && !validStatuses.includes(status)) {
      throw fail('Invalid subscription status')
    }

    let selectedProduct = null

    if (productId) {
      validateObjectId(productId, 'product ID')

      selectedProduct = await Product.findOne({
        _id: productId,
        tenantId
      }).lean()

      if (!selectedProduct) {
        throw fail('Product not found for this tenant', 404)
      }

      if (selectedProduct.status === 'Inactive') {
        throw fail('Cannot subscribe to an inactive product')
      }
    }

    const finalProductName = selectedProduct
      ? selectedProduct.name
      : String(productName || '').trim()

    const finalAmount = selectedProduct
      ? Number(selectedProduct.price)
      : Number(amount)

    const finalBillingCycle = selectedProduct
      ? selectedProduct.billing
      : billingCycle || 'Monthly'

    if (!finalProductName) {
      throw fail('Product name is required when no product is selected')
    }

    if (
      !Number.isFinite(finalAmount) ||
      finalAmount < 0
    ) {
      throw fail('A valid non-negative amount is required')
    }

    if (!validCycles.includes(finalBillingCycle)) {
      throw fail('Invalid product billing cycle')
    }

    const parsedStartDate = startDate
      ? new Date(startDate)
      : new Date()

    if (Number.isNaN(parsedStartDate.getTime())) {
      throw fail('Invalid start date')
    }

    const parsedNextBillingDate = nextBillingDate
      ? new Date(nextBillingDate)
      : null

    const parsedEndDate = endDate ? new Date(endDate) : null

    if (
      parsedNextBillingDate &&
      Number.isNaN(parsedNextBillingDate.getTime())
    ) {
      throw fail('Invalid next billing date')
    }

    if (parsedEndDate && Number.isNaN(parsedEndDate.getTime())) {
      throw fail('Invalid end date')
    }

    if (
      parsedNextBillingDate &&
      parsedNextBillingDate < parsedStartDate
    ) {
      throw fail('Next billing date cannot precede the start date')
    }

    if (parsedEndDate && parsedEndDate < parsedStartDate) {
      throw fail('End date cannot precede the start date')
    }

    const subscription = await ClientSubscription.create({
      tenantId,
      customerName: String(customerName).trim(),
      customerEmail: email,
      customerCompany: String(customerCompany || '').trim(),
      productId: selectedProduct?._id || null,
      productName: finalProductName,
      amount: finalAmount,
      billingCycle: finalBillingCycle,
      startDate: parsedStartDate,
      nextBillingDate: parsedNextBillingDate,
      endDate: parsedEndDate,
      status: status || 'Pending',
      notes: String(notes || '').trim()
    })

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription
    })
  } catch (error) {
    next(error)
  }
}

const updateSubscription = async (req, res, next) => {
  try {
    ensureClientAdmin(req)
    const tenantId = getTenantId(req)

    validateObjectId(req.params.id, 'subscription ID')

    const allowedFields = [
      'customerName',
      'customerEmail',
      'customerCompany',
      'productName',
      'amount',
      'billingCycle',
      'startDate',
      'nextBillingDate',
      'endDate',
      'status',
      'notes'
    ]

    const updates = {}

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    }

    if (updates.customerName !== undefined) {
      updates.customerName = String(updates.customerName).trim()

      if (!updates.customerName) {
        throw fail('Customer name cannot be empty')
      }
    }

    if (updates.customerEmail !== undefined) {
      updates.customerEmail = String(updates.customerEmail)
        .trim()
        .toLowerCase()

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updates.customerEmail)) {
        throw fail('Enter a valid customer email address')
      }
    }

    if (updates.customerCompany !== undefined) {
      updates.customerCompany = String(updates.customerCompany).trim()
    }

    if (updates.productName !== undefined) {
      updates.productName = String(updates.productName).trim()

      if (!updates.productName) {
        throw fail('Product name cannot be empty')
      }
    }

    if (updates.notes !== undefined) {
      updates.notes = String(updates.notes).trim()
    }

    if (updates.amount !== undefined) {
      updates.amount = Number(updates.amount)

      if (!Number.isFinite(updates.amount) || updates.amount < 0) {
        throw fail('Amount must be a valid non-negative number')
      }
    }

    if (
      updates.billingCycle !== undefined &&
      !['Monthly', 'Yearly', 'One-time'].includes(updates.billingCycle)
    ) {
      throw fail('Invalid billing cycle')
    }

    if (
      updates.status !== undefined &&
      !['Active', 'Pending', 'Expired', 'Cancelled'].includes(updates.status)
    ) {
      throw fail('Invalid subscription status')
    }

    for (const field of ['startDate', 'nextBillingDate', 'endDate']) {
      if (updates[field] !== undefined) {
        if (updates[field] === null || updates[field] === '') {
          updates[field] = null
        } else {
          const date = new Date(updates[field])

          if (Number.isNaN(date.getTime())) {
            throw fail(`Invalid ${field}`)
          }

          updates[field] = date
        }
      }
    }

    if (!Object.keys(updates).length) {
      throw fail('No valid fields provided for update')
    }

    const existing = await ClientSubscription.findOne({
      _id: req.params.id,
      tenantId
    })

    if (!existing) {
      throw fail('Subscription not found', 404)
    }

    const effectiveStartDate = updates.startDate !== undefined
      ? updates.startDate
      : existing.startDate

    const effectiveNextBillingDate =
      updates.nextBillingDate !== undefined
        ? updates.nextBillingDate
        : existing.nextBillingDate

    const effectiveEndDate = updates.endDate !== undefined
      ? updates.endDate
      : existing.endDate

    if (
      effectiveNextBillingDate &&
      effectiveStartDate &&
      effectiveNextBillingDate < effectiveStartDate
    ) {
      throw fail('Next billing date cannot precede the start date')
    }

    if (
      effectiveEndDate &&
      effectiveStartDate &&
      effectiveEndDate < effectiveStartDate
    ) {
      throw fail('End date cannot precede the start date')
    }

    Object.assign(existing, updates)
    await existing.save()

    res.status(200).json({
      success: true,
      message: 'Subscription updated successfully',
      subscription: existing
    })
  } catch (error) {
    next(error)
  }
}

const cancelSubscription = async (req, res, next) => {
  try {
    ensureClientAdmin(req)
    const tenantId = getTenantId(req)

    validateObjectId(req.params.id, 'subscription ID')

    const subscription = await ClientSubscription.findOneAndUpdate(
      {
        _id: req.params.id,
        tenantId,
        status: { $ne: 'Cancelled' }
      },
      { status: 'Cancelled' },
      { new: true, runValidators: true }
    )

    if (!subscription) {
      const existing = await ClientSubscription.exists({
        _id: req.params.id,
        tenantId
      })

      if (!existing) {
        throw fail('Subscription not found', 404)
      }

      throw fail('Subscription is already cancelled', 409)
    }

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription
    })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription
}
