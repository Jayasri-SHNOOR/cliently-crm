const ServiceRequest = require('../../../models/ServiceRequest')
const { fail, checkId, text, addUpdate, formatRequest } = require('../helpers')

const NEXT_STATUS = {
  Assigned: ['In Progress'],
  'In Progress': ['Completed']
}

async function listMyJobs(req, res, next) {
  try {
    const filter = { tenantId: req.user.tenantId, assignedTo: req.user.id }
    if (req.query.status && req.query.status !== 'All') filter.status = String(req.query.status)
    const requests = await ServiceRequest.find(filter)
      .populate('customerId', 'customerCode name phone city')
      .sort({ scheduledDate: 1, createdAt: -1 })
      .limit(500)
      .lean()
    res.json({ count: requests.length, serviceRequests: requests.map((r) => formatRequest(r)) })
  } catch (err) {
    next(err)
  }
}

async function findMyJob(req) {
  checkId(req.params.id, 'request')
  const request = await ServiceRequest.findOne({
    _id: req.params.id,
    tenantId: req.user.tenantId,
    assignedTo: req.user.id
  }).populate('customerId', 'customerCode name phone city')
  if (!request) throw fail('Service request not found', 404)
  return request
}

async function getJob(req, res, next) {
  try {
    const request = await findMyJob(req)
    res.json({ serviceRequest: formatRequest(request) })
  } catch (err) {
    next(err)
  }
}

async function updateStatus(req, res, next) {
  try {
    const request = await findMyJob(req)
    const status = text(req.body.status, 20)
    const allowed = NEXT_STATUS[request.status] || []
    if (!allowed.includes(status)) {
      throw fail(allowed.length ? `Next status can only be: ${allowed.join(', ')}` : `This request is already ${request.status}`)
    }
    if (status === 'Completed' && !text(req.body.note, 500)) {
      throw fail('Add a short note about the work done')
    }

    request.status = status
    if (status === 'Completed') request.completedAt = new Date()
    addUpdate(request, status, req.body.note, req)
    await request.save()

    res.json({ message: `Marked ${status.toLowerCase()}`, serviceRequest: formatRequest(request) })
  } catch (err) {
    next(err)
  }
}

module.exports = { listMyJobs, getJob, updateStatus }