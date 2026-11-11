const Ticket = require('../../../models/Ticket')
const Employee = require('../../../models/Employee')
const Product = require('../../../models/Product')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const nextSequence = require('../../../utils/nextSequence')
const {TICKET_STATUSES, TICKET_PRIORITIES, TICKET_CATEGORIES} = require('../../../models/Ticket')
const {
  assertValidId,
  parsePagination,
  sendPage,
  enumFilter,
  applyAssigneeFilter,
  searchRegex,
  refInTenant
} = require('../helpers')

const POPULATE = [
  {path: 'assignedTo', select: 'name'},
  {path: 'productId', select: 'name'}
]
const EDITABLE = ['subject', 'description', 'customer', 'category', 'priority']
const PRIORITY_ORDER = ['Urgent', 'High', 'Medium', 'Low']
const ACTIVE_STATUSES = ['Open', 'In Progress', 'Waiting on Customer']
const SORTS = ['newest', 'oldest', 'priority']

async function findTicket(req){
  assertValidId(req.params.id, 'ticket')
  const ticket = await Ticket.findOne({_id: req.params.id, tenantId: req.user.tenantId})
  if(!ticket){
    throw new AppError('Ticket not found', 404)
  }
  return ticket
}

function applyStatus(ticket, status){
  if(status === undefined || status === ticket.status){
    return
  }
  const now = new Date()
  ticket.status = status
  if(status === 'Resolved'){
    ticket.resolvedAt = now
    ticket.closedAt = null
  }else if(status === 'Closed'){
    ticket.closedAt = now
    if(!ticket.resolvedAt){
      ticket.resolvedAt = now
    }
  }else if(ACTIVE_STATUSES.includes(status)){
    ticket.resolvedAt = null
    ticket.closedAt = null
  }
}

async function applyRefs(ticket, body, tenantId){
  if(body.assignedTo !== undefined){
    ticket.assignedTo = await refInTenant(Employee, body.assignedTo, tenantId, 'Employee')
  }
  if(body.productId !== undefined){
    ticket.productId = await refInTenant(Product, body.productId, tenantId, 'Product')
  }
}

async function listTickets(req, res, next){
  try{
    const filter = { tenantId: req.user.tenantId }
    enumFilter(filter, 'status', req.query.status, TICKET_STATUSES)
    enumFilter(filter, 'priority', req.query.priority, TICKET_PRIORITIES)
    enumFilter(filter, 'category', req.query.category, TICKET_CATEGORIES)
    applyAssigneeFilter(filter, req.query.assignedTo, req.user)

    const regex = searchRegex(req.query.q)
    if(regex){
      filter.$or = [
        {subject: regex},
        {'customer.name': regex},
        {'customer.company': regex},
        {'customer.email': regex}
      ]
    }

    const sort = req.query.sort || 'newest'
    if(!SORTS.includes(sort)){
      throw new AppError(`sort must be one of: ${SORTS.join(', ')}`, 400)
    }

    const paging = parsePagination(req.query)
    const total = await Ticket.countDocuments(filter)
    let tickets
    if(sort === 'priority'){
      const rows = await Ticket.aggregate([
        {$match: filter},
        {$addFields: {priorityRank: {$indexOfArray: [PRIORITY_ORDER, '$priority']}}},
        {$sort: {priorityRank: 1, createdAt: -1}},
        {$skip: paging.skip},
        {$limit: paging.limit},
        {$project: { description: 0, notes: 0, priorityRank: 0}}
      ])
      tickets = await Ticket.populate(rows, POPULATE)
    }else{
      tickets = await Ticket.find(filter)
        .select('-description -notes')
        .sort({ createdAt: sort === 'oldest' ? 1 : -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .populate(POPULATE)
        .lean()
    }

    sendPage(res, tickets, total, paging)
  } catch(err){
    next(err)
  }
}

async function getTicket(req, res, next){
  try{
    const ticket = await findTicket(req)
    await ticket.populate(POPULATE)
    res.json({data: ticket})
  }catch(err){
    next(err)
  }
}

async function createTicket(req, res, next){
  try{
    const {tenantId} = req.user
    const ticket = new Ticket({
      ...pick(req.body, EDITABLE),
      tenantId,
      createdBy: req.user.id
    })
    await applyRefs(ticket, req.body, tenantId)
    await ticket.validate({pathsToSkip: ['number']})

    ticket.number = await nextSequence(`ticket:${tenantId}`)
    await ticket.save()
    await ticket.populate(POPULATE)

    res.status(201).json({data: ticket})
  }catch(err){
    next(err)
  }
}

async function updateTicket(req, res, next){
  try{
    const ticket = await findTicket(req)
    const updates = pick(req.body, EDITABLE)
    const touchesOther = ['status', 'assignedTo', 'productId'].some((key) => req.body[key] !== undefined)

    if(Object.keys(updates).length === 0 && !touchesOther){
      throw new AppError('Provide at least one field to update', 400)
    }

    ticket.set(updates)
    applyStatus(ticket, req.body.status)
    await applyRefs(ticket, req.body, req.user.tenantId)
    await ticket.save()
    await ticket.populate(POPULATE)

    res.json({data: ticket})
  }catch(err){
    next(err)
  }
}

async function addNote(req, res, next){
  try{
    const ticket = await findTicket(req)
    const text = typeof req.body.text === 'string' ? req.body.text.trim() : ''
    if(!text){
      throw new AppError('Note text is required', 400)
    }

    ticket.notes.push({text, authorId: req.user.id, authorName: req.user.name})
    await ticket.save()
    await ticket.populate(POPULATE)

    res.json({data: ticket})
  }catch(err){
    next(err)
  }
}

async function deleteTicket(req, res, next){
  try{
    assertValidId(req.params.id, 'ticket')
    const ticket = await Ticket.findOneAndDelete({_id: req.params.id, tenantId: req.user.tenantId})
    if(!ticket){
      throw new AppError('Ticket not found', 404)
    }
    res.json({message: 'Ticket deleted'})
  }catch(err){
    next(err)
  }
}

module.exports = {listTickets, getTicket, createTicket, updateTicket, addNote, deleteTicket}