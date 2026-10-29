const SupportTicket = require('../../../models/SupportTicket')
const { MAX_MESSAGE_LENGTH, MAX_MESSAGES } = require('../../../models/SupportTicket')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const nextSequence = require('../../../utils/nextSequence')
const CREATE_FIELDS = ['subject', 'category', 'priority']
const REOPEN_ON_REPLY = ['Resolved', 'Waiting on Customer']

function readMessageText(body, fieldName) {
  const text = typeof body[fieldName] === 'string' ? body[fieldName].trim() : ''
  if(!text){
    throw new AppError(`${fieldName === 'description' ? 'Description' : 'Message'} is required`, 400)
  }
  if(text.length > MAX_MESSAGE_LENGTH){
    throw new AppError(`Text must be ${MAX_MESSAGE_LENGTH} characters or less`, 400)
  }
  return text
}

function formatMessage(message) {
  return{
    id: message._id,
    authorName: message.authorName,
    authorRole: message.authorRole,
    text: message.text,
    createdAt: message.createdAt
  }
}

function formatTicket(ticket) {
  return{
    id: ticket._id,
    ticketNumber: ticket.ticketNumber,
    subject: ticket.subject,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    createdBy: ticket.createdBy?.name || '',
    createdAt: ticket.createdAt,
    lastActivityAt: ticket.lastActivityAt,
    closedAt: ticket.closedAt || null,
    messages: ticket.messages.map(formatMessage)
  }
}

async function createTicket(req, res, next) {
  try{
    const {tenantId, name} = req.user
    const data = pick(req.body, CREATE_FIELDS)
    const description = readMessageText(req.body, 'description')
    const ticket = new SupportTicket({
      ...data,
      tenantId,
      createdBy: {name},
      messages: [{authorName: name, authorRole: 'CLIENT_ADMIN', text: description}]
    })
    await ticket.validate({pathsToSkip: ['ticketNumber']})
    const seq = await nextSequence(`ticket:${tenantId}`)
    ticket.ticketNumber = `TKT-${1000 + seq}`
    await ticket.save()
    res.status(201).json(formatTicket(ticket))
  } catch (err) {
    next(err)
  }
}

async function listTickets(req, res, next) {
  try{
    const {tenantId} = req.user
    const status = typeof req.query.status === 'string' ? req.query.status : ''

    const match = {tenantId}
    if(status) match.status = status

    const tickets = await SupportTicket.aggregate([
      {$match: match},
      {$sort: { lastActivityAt: -1 }},
      {
        $project: {
          ticketNumber: 1,
          subject: 1,
          category: 1,
          priority: 1,
          status: 1,
          createdAt: 1,
          lastActivityAt: 1,
          messageCount: { $size: '$messages' }
        }
      }
    ])

    res.json({
      count: tickets.length,
      tickets: tickets.map((ticket) => ({
        id: ticket._id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        messageCount: ticket.messageCount,
        createdAt: ticket.createdAt,
        lastActivityAt: ticket.lastActivityAt
      }))
    })
  } catch(err){
    next(err)
  }
}

async function getTicket(req, res, next) {
  try{
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).lean()
    if(!ticket){
      throw new AppError('Ticket not found', 404)
    }
    res.json(formatTicket(ticket))
  }catch(err) {
    next(err)
  }
}

async function addMessage(req, res, next) {
  try{
    const text = readMessageText(req.body, 'text')
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    if(!ticket) {
      throw new AppError('Ticket not found', 404)
    }
    if (ticket.status === 'Closed') {
      throw new AppError('This ticket is closed. Please open a new ticket.', 409)
    }
    if (ticket.messages.length >= MAX_MESSAGES) {
      throw new AppError('This ticket has too many messages. Please open a new ticket.', 409)
    }
    ticket.messages.push({ authorName: req.user.name, authorRole: 'CLIENT_ADMIN', text })
    if (REOPEN_ON_REPLY.includes(ticket.status)) {
      ticket.status = 'Open'
    }
    ticket.lastActivityAt = new Date()
    await ticket.save()
    res.status(201).json(formatTicket(ticket))
  }catch(err) {
    next(err)
  }
}

async function closeTicket(req, res, next) {
  try{
    const ticket = await SupportTicket.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    if(!ticket){
      throw new AppError('Ticket not found', 404)
    }
    if (ticket.status === 'Closed') {
      throw new AppError('Ticket is already closed', 409)
    }
    ticket.status = 'Closed'
    ticket.closedAt = new Date()
    ticket.lastActivityAt = new Date()
    await ticket.save()
    res.json(formatTicket(ticket))
  }catch(err) {
    next(err)
  }
}

module.exports = { createTicket, listTickets, getTicket, addMessage, closeTicket }