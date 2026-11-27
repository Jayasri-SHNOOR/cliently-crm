const mongoose = require('mongoose')
const Employee = require('../../models/Employee')

const UNASSIGNED = {
  $or: [{ executive: { $exists: false } }, { executive: null }, { executive: '' }]
}
const SALES_ROLE = /^sales executive$/i
const CLOSED = ['Won', 'Lost']
const PRIORITIES = ['High', 'Medium', 'Low']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toId = (id) => new mongoose.Types.ObjectId(id)

// Employee ids of everyone who reports to the logged-in manager
async function getTeamIds(req) {
  if (!req.user.employeeId) return []
  return Employee.find({
    tenantId: toId(req.user.tenantId),
    managerId: toId(req.user.employeeId)
  }).distinct('_id')
}

function formatLead(l) {
  return {
    id: l._id,
    name: l.name,
    company: l.company,
    email: l.email,
    phone: l.phone,
    product: l.productName || l.productInterested,
    status: l.status,
    value: l.value,
    source: l.source,
    message: l.message,
    executive: l.executive || null,
    executiveId: l.executiveId || null,
    priority: l.priority || null,
    nextFollowUp: l.nextFollowUp || null,
    assignedAt: l.assignedAt || null,
    createdAt: l.createdAt
  }
}

module.exports = { UNASSIGNED, SALES_ROLE, CLOSED, PRIORITIES, MONTHS, toId, formatLead, getTeamIds }