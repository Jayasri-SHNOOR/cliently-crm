const Customer = require('../../../models/Customer')
const ServiceRequest = require('../../../models/ServiceRequest')
const { assignRequest } = require('./assignService')
const { OPEN_STATUSES, fail, checkId, findTeamUser, listTeam, formatRequest } = require('../helpers')

async function listCustomers(req, res, next) {
  try {
    const filter = { tenantId: req.user.tenantId }
    if (req.query.unassigned === 'true') filter.salesExecId = null
    const customers = await Customer.find(filter)
      .select('customerCode name phone city status salesExecId salesExecName createdAt')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
    res.json({
      count: customers.length,
      customers: customers.map((c) => ({
        id: c._id,
        customerCode: c.customerCode,
        name: c.name,
        phone: c.phone,
        city: c.city,
        status: c.status,
        salesExecId: c.salesExecId || null,
        salesExecName: c.salesExecName || null,
        createdAt: c.createdAt
      }))
    })
  } catch (err) {
    next(err)
  }
}

async function setSalesExec(req, res, next) {
  try {
    checkId(req.params.id, 'customer')
    const exec = await findTeamUser(req.user.tenantId, req.body.salesExecId, 'SALES_EXECUTIVE', 'Sales executive')

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: { salesExecId: exec._id, salesExecName: exec.name } },
      { returnDocument: 'after' }
    ).lean()
    if (!customer) throw fail('Customer not found', 404)

    await ServiceRequest.updateMany(
      { tenantId: req.user.tenantId, customerId: customer._id, status: { $in: OPEN_STATUSES } },
      { $set: { salesExecId: exec._id } }
    )

    res.json({ message: `${customer.name} is now handled by ${exec.name}` })
  } catch (err) {
    next(err)
  }
}

async function listRequests(req, res, next) {
  try {
    const filter = { tenantId: req.user.tenantId }
    if (req.query.status && req.query.status !== 'All') filter.status = String(req.query.status)
    if (req.query.unassigned === 'true') filter.assignedTo = null
    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'customerCode name phone city')
      .sort({ createdAt: -1 })
      .limit(500)
      .lean()
    res.json({ count: requests.length, serviceRequests: requests.map((r) => formatRequest(r)) })
  } catch (err) {
    next(err)
  }
}

async function assign(req, res, next) {
  try {
    const request = await assignRequest(req, {})
    res.json({ message: `Assigned to ${request.assignedToName}`, serviceRequest: request })
  } catch (err) {
    next(err)
  }
}

async function listStaff(req, res, next) {
  try {
    res.json({ staff: await listTeam(req.user.tenantId, 'OPERATIONAL_STAFF') })
  } catch (err) {
    next(err)
  }
}

async function listSalesExecs(req, res, next) {
  try {
    res.json({ salesExecutives: await listTeam(req.user.tenantId, 'SALES_EXECUTIVE') })
  } catch (err) {
    next(err)
  }
}

module.exports = { listCustomers, setSalesExec, listRequests, assign, listStaff, listSalesExecs }