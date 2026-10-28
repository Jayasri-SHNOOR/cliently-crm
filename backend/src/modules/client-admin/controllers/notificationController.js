const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const {CLOSED_STATUSES} = require('../../../models/Deal')
const SupportTicket = require('../../../models/SupportTicket')
const Tenant = require('../../../models/Tenant')
const AppError = require('../../../utils/AppError')
const DAY_MS = 24*60*60 *1000
const DEAL_LOOKAHEAD_DAYS = 7
const NEW_LEAD_DAYS = 7
const MAX_NOTIFICATIONS = 20

function plural(count, word){
  return `${count} ${word}${count === 1 ? '' : 's'}`
}

function formatMoney(value){
  return `₹${(value || 0).toLocaleString('en-IN')}`
}

function dealNotification(deal, now){
  const due = new Date(deal.expectedClose)
  const daysLeft = Math.ceil((due - now) / DAY_MS)
  const label = `${deal.name} for ${deal.customer} (${formatMoney(deal.value)})`
  if(daysLeft < 0){
    return{
      id: `deal-overdue:${deal._id}`,
      type: 'deal_overdue',
      severity: 'danger',
      title: 'Deal overdue',
      message: `${label} was expected to close ${plural(-daysLeft, 'day')} ago`,
      link: { page: 'deals', id: deal._id },
      createdAt: due
    }
  }

  return{
    id: `deal-due:${deal._id}`,
    type: 'deal_closing_soon',
    severity: 'warning',
    title: 'Deal closing soon',
    message: daysLeft === 0 ? `${label} closes today` : `${label} closes in ${plural(daysLeft, 'day')}`,
    link: { page: 'deals', id: deal._id },
    createdAt: new Date(due.getTime() - DEAL_LOOKAHEAD_DAYS * DAY_MS)
  }
}

function leadNotification(lead){
  return{
    id: `lead-new:${lead._id}`,
    type: 'lead_new',
    severity: 'info',
    title: 'New lead',
    message: lead.company ? `${lead.name} from ${lead.company} was added` : `${lead.name} was added`,
    link: { page: 'leads', id: lead._id },
    createdAt: lead.createdAt
  }
}

function ticketNotification(ticket){
  const resolved = ticket.status === 'Resolved'
  return{
    id: `ticket:${ticket._id}`,
    type: resolved ? 'ticket_resolved' : 'ticket_waiting',
    severity: resolved ? 'success' : 'warning',
    title: resolved ? 'Ticket resolved' : 'Support needs your reply',
    message: `${ticket.ticketNumber}: ${ticket.subject}`,
    link: { page: 'support', id: ticket._id },
    createdAt: ticket.lastActivityAt
  }
}

async function listNotifications(req, res, next){
  try{
    const {tenantId} = req.user
    const now = new Date()
    const [tenant, deals, leads, tickets] = await Promise.all([
      Tenant.findById(tenantId).select('notificationsReadAt').lean(),
      Deal.find({
        tenantId,
        status: { $nin: CLOSED_STATUSES },
        expectedClose: { $ne: null, $lte: new Date(now.getTime() + DEAL_LOOKAHEAD_DAYS * DAY_MS) }
      })
        .select('name customer value expectedClose')
        .lean(),
      Lead.find({
        tenantId,
        createdAt: { $gte: new Date(now.getTime() - NEW_LEAD_DAYS * DAY_MS) }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name company createdAt')
        .lean(),
      SupportTicket.find({
        tenantId,
        status: { $in: ['Waiting on Customer', 'Resolved'] }
      })
        .select('ticketNumber subject status lastActivityAt')
        .lean()
    ])
    if(!tenant){
      throw new AppError('Company not found', 404)
    }

    const readAt = tenant.notificationsReadAt || null
    const all = [
      ...deals.map((deal) => dealNotification(deal, now)),
      ...leads.map(leadNotification),
      ...tickets.map(ticketNotification)
    ]
      .map((item) => ({ ...item, read: Boolean(readAt) && item.createdAt <= readAt }))
      .sort((a, b) => b.createdAt - a.createdAt)

    res.json({
      unreadCount: all.filter((item) => !item.read).length,
      readAt,
      notifications: all.slice(0, MAX_NOTIFICATIONS)
    })
  }catch(err) {
    next(err)
  }
}

async function markAllRead(req, res, next){
  try{
    const tenant = await Tenant.findByIdAndUpdate(
      req.user.tenantId,
      { notificationsReadAt: new Date() },
      { returnDocument: 'after' }
    ).lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    res.json({ unreadCount: 0, readAt: tenant.notificationsReadAt })
  }catch(err){
    next(err)
  }
}

module.exports = {listNotifications,markAllRead}