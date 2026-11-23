const mongoose = require('mongoose')

const UNASSIGNED = {
  $or: [{ executive: { $exists: false } }, { executive: null }, { executive: '' }]
}
const SALES_ROLE = /^sales executive$/i
const CLOSED = ['Won', 'Lost']
const PRIORITIES = ['High', 'Medium', 'Low']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const toId = (id) => new mongoose.Types.ObjectId(id)

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
    priority: l.priority || 'Medium',
    nextFollowUp: l.nextFollowUp || null,
    assignedAt: l.assignedAt || null,
    createdAt: l.createdAt
  }
}

module.exports = { UNASSIGNED, SALES_ROLE, CLOSED, PRIORITIES, MONTHS, toId, formatLead }