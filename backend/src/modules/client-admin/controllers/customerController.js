const mongoose = require('mongoose')
const Customer = require('../../../models/Customer')
const AppError = require('../../../utils/AppError')
const escapeRegex = require('../../../utils/escapeRegex')
const pick = require('../../../utils/pick')
const nextSequence = require('../../../utils/nextSequence')

const ALLOWED_FIELDS = ['name', 'company', 'email', 'phone', 'address', 'city', 'customerType', 'status']
const STATUSES = ['Active', 'Inactive', 'Prospect']

function formatCustomer(c) {
  return {
    id: c._id,
    customerCode: c.customerCode || null,
    name: c.name,
    company: c.company,
    email: c.email,
    phone: c.phone,
    address: c.address,
    city: c.city,
    customerType: c.customerType,
    status: c.status,
    createdAt: c.createdAt
  }
}

async function getSummary(tenantId) {
  const rows = await Customer.aggregate([
    { $match: { tenantId: new mongoose.Types.ObjectId(tenantId) } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ])
  const by = Object.fromEntries(rows.map((r) => [r._id, r.count]))
  return {
    total: rows.reduce((s, r) => s + r.count, 0),
    active: by.Active ?? 0,
    inactive: by.Inactive ?? 0,
    prospect: by.Prospect ?? 0
  }
}

async function listCustomers(req, res, next) {
  try {
    const { tenantId } = req.user
    const { status, search } = req.query
    const filter = { tenantId }

    if (status && STATUSES.includes(status)) filter.status = status
    if (search?.trim()) {
      const p = new RegExp(escapeRegex(search.trim().slice(0, 50)), 'i')
      filter.$or = [{ name: p }, { company: p }, { email: p }, { phone: p }, { customerCode: p }]
    }

    const [customers, summary] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).lean(),
      getSummary(tenantId)
    ])

    res.json({ summary, count: customers.length, customers: customers.map(formatCustomer) })
  } catch (err) {
    next(err)
  }
}

async function getCustomer(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid customer ID', 400)
    const customer = await Customer.findOne({ _id: req.params.id, tenantId: req.user.tenantId }).lean()
    if (!customer) throw new AppError('Customer not found', 404)
    res.json(formatCustomer(customer))
  } catch (err) {
    next(err)
  }
}

async function createCustomer(req, res, next) {
  try {
    const { tenantId } = req.user
    const data = pick(req.body, ALLOWED_FIELDS)

    if (!data.name?.trim()) throw new AppError('Customer name is required', 400)
    if (data.status && !STATUSES.includes(data.status)) throw new AppError('Invalid status', 400)

    if (data.email) {
      const duplicate = await Customer.exists({ tenantId, email: data.email.trim().toLowerCase() })
      if (duplicate) throw new AppError('A customer with this email already exists', 409)
    }

    const seq = await nextSequence(`customer:${tenantId}`)
    const customer = await Customer.create({
      ...data,
      tenantId,
      customerCode: `CUST-${String(seq).padStart(4, '0')}`
    })

    res.status(201).json(formatCustomer(customer))
  } catch (err) {
    next(err)
  }
}

async function updateCustomer(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid customer ID', 400)
    const updates = pick(req.body, ALLOWED_FIELDS)
    if (Object.keys(updates).length === 0) throw new AppError('No valid fields to update', 400)
    if (updates.status && !STATUSES.includes(updates.status)) throw new AppError('Invalid status', 400)

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    ).lean()

    if (!customer) throw new AppError('Customer not found', 404)
    res.json(formatCustomer(customer))
  } catch (err) {
    next(err)
  }
}

async function deleteCustomer(req, res, next) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) throw new AppError('Invalid customer ID', 400)
    const customer = await Customer.findOneAndDelete({ _id: req.params.id, tenantId: req.user.tenantId })
    if (!customer) throw new AppError('Customer not found', 404)
    res.json({ message: 'Customer deleted', id: customer._id })
  } catch (err) {
    next(err)
  }
}

module.exports = { listCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer }