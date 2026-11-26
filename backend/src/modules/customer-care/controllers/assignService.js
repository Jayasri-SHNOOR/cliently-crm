const ServiceRequest = require('../../../models/ServiceRequest')
const { fail, checkId, optionalDate, startOfToday, findTeamUser, addUpdate, formatRequest } = require('../helpers')

async function assignRequest(req, filter) {
  checkId(req.params.id, 'request')
  const { staffId, scheduledDate, note } = req.body

  const staff = await findTeamUser(req.user.tenantId, staffId, 'OPERATIONAL_STAFF', 'Operational staff')
  const schedule = optionalDate(scheduledDate, 'scheduled date')
  if (schedule && schedule < startOfToday()) throw fail('Scheduled date cannot be in the past')

  const request = await ServiceRequest.findOne({ ...filter, _id: req.params.id, tenantId: req.user.tenantId })
  if (!request) throw fail('Service request not found', 404)
  if (!['Requested', 'Assigned'].includes(request.status)) {
    throw fail(`A ${request.status.toLowerCase()} request cannot be assigned`)
  }

  request.assignedTo = staff._id
  request.assignedToName = staff.name
  request.status = 'Assigned'
  if (schedule) request.scheduledDate = schedule
  addUpdate(request, 'Assigned', note || `Assigned to ${staff.name}`, req)
  await request.save()

  return formatRequest(request)
}

module.exports = { assignRequest }