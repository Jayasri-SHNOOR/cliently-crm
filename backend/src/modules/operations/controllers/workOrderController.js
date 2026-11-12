const WorkOrder = require('../../../models/WorkOrder')
const Employee = require('../../../models/Employee')
const Product = require('../../../models/Product')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const nextSequence = require('../../../utils/nextSequence')
const {WORK_ORDER_STATUSES, WORK_ORDER_PRIORITIES} = require('../../../models/WorkOrder')
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
  {path: 'productId', select: 'name'},
  {path: 'dealId', select: 'name customer value'}
]
const EDITABLE = ['title', 'description', 'customer', 'priority']
const DATE_FIELDS = ['startDate', 'dueDate']
const CLOSED_STATUSES = ['Completed', 'Cancelled']
const SORTS = ['newest', 'dueDate']
const MAX_MILESTONES = 50

function startOfToday(){
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

function present(source, {list = false} = {}){
  const workOrder = typeof source.toObject === 'function'
    ? source.toObject({virtuals: false})
    : {...source}
  const milestones = workOrder.milestones || []
  const done = milestones.filter((milestone) => milestone.done).length

  workOrder.milestonesTotal = milestones.length
  workOrder.milestonesDone = done
  workOrder.progress = milestones.length === 0
    ? (workOrder.status === 'Completed' ? 100 : 0)
    : Math.round((done / milestones.length) * 100)
  workOrder.overdue = Boolean(workOrder.dueDate)
    && new Date(workOrder.dueDate) < startOfToday()
    && !CLOSED_STATUSES.includes(workOrder.status)

    
  if(list){
    delete workOrder.milestones
    delete workOrder.description
  }
  return workOrder
}

function dateValue(value){
  return value === '' ? null : value
}

function applyDates(workOrder, body){
  DATE_FIELDS.forEach((field) => {
    if(body[field] !== undefined){
      workOrder[field] = dateValue(body[field])
    }
  })
}

function applyStatus(workOrder, status){
  if(status === undefined || status === workOrder.status){
    return
  }
  workOrder.status = status
  workOrder.completedAt = status === 'Completed' ? new Date() : null
}

async function applyRefs(workOrder, body, tenantId){
  if(body.assignedTo !== undefined){
    workOrder.assignedTo = await refInTenant(Employee, body.assignedTo, tenantId, 'Employee')
  }
  if(body.productId !== undefined){
    workOrder.productId = await refInTenant(Product, body.productId, tenantId, 'Product')
  }
}

function milestoneInput(value){
  const item = value && typeof value === 'object' ? value : {}
  return {title: item.title, dueDate: dateValue(item.dueDate ?? null)}
}

async function findWorkOrder(req){
  assertValidId(req.params.id, 'work order')
  const workOrder = await WorkOrder.findOne({_id: req.params.id, tenantId: req.user.tenantId})
  if(!workOrder){
    throw new AppError('Work order not found', 404)
  }
  return workOrder
}

function findMilestone(workOrder, milestoneId){
  assertValidId(milestoneId, 'milestone')
  const milestone = workOrder.milestones.id(milestoneId)
  if(!milestone){
    throw new AppError('Milestone not found', 404)
  }
  return milestone
}

async function respond(res, workOrder, status = 200){
  await workOrder.populate(POPULATE)
  res.status(status).json({data: present(workOrder)})
}

async function listWorkOrders(req, res, next){
  try{
    const filter = {tenantId: req.user.tenantId}
    enumFilter(filter, 'status', req.query.status, WORK_ORDER_STATUSES)
    enumFilter(filter, 'priority', req.query.priority, WORK_ORDER_PRIORITIES)
    applyAssigneeFilter(filter, req.query.assignedTo, req.user)

    const regex = searchRegex(req.query.q)
    if(regex){
      filter.$or = [{title: regex}, {'customer.name': regex}, {'customer.company': regex}]
    }

    if (req.query.overdue === 'true'){
      filter.dueDate = {$lt: startOfToday()}
      filter.$and = [{status: {$nin: CLOSED_STATUSES}}]
    }

    const sort = req.query.sort || 'newest'
    if(!SORTS.includes(sort)){
      throw new AppError(`sort must be one of: ${SORTS.join(', ')}`, 400)
    }

    const paging = parsePagination(req.query)
    const total = await WorkOrder.countDocuments(filter)

    let rows
    if(sort === 'dueDate'){
      rows = await WorkOrder.aggregate([
        {$match: filter},
        {$addFields: {noDueDate: {$cond: [{$eq: [{$ifNull: ['$dueDate', null]}, null]}, 1, 0]}}},
        {$sort: {noDueDate: 1,dueDate: 1,createdAt: -1}},
        {$skip: paging.skip},
        {$limit: paging.limit},
        {$project: {description: 0, noDueDate: 0}}
      ])
      rows = await WorkOrder.populate(rows, POPULATE)
    }else{
      rows = await WorkOrder.find(filter)
        .select('-description')
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .populate(POPULATE)
        .lean()
    }

    sendPage(res, rows.map((row) => present(row, {list: true})), total, paging)
  }catch(err){
    next(err)
  }
}

async function getWorkOrder(req, res, next){
  try{
    const workOrder = await findWorkOrder(req)
    await respond(res, workOrder)
  }catch(err){
    next(err)
  }
}

async function createWorkOrder(req, res, next){
  try{
    const {tenantId} = req.user
    const milestones = req.body.milestones === undefined ? [] : req.body.milestones

    if(!Array.isArray(milestones)){
      throw new AppError('milestones must be a list', 400)
    }
    if(milestones.length > MAX_MILESTONES){
      throw new AppError(`A work order can have at most ${MAX_MILESTONES} milestones`, 400)
    }

    const workOrder = new WorkOrder({
      ...pick(req.body, EDITABLE),
      tenantId,
      createdBy: req.user.id,
      milestones: milestones.map(milestoneInput)
    })
    applyDates(workOrder, req.body)
    applyStatus(workOrder, req.body.status)
    await applyRefs(workOrder, req.body, tenantId)
    await workOrder.validate({ pathsToSkip: ['number'] })

    workOrder.number = await nextSequence(`workorder:${tenantId}`)
    await workOrder.save()
    await respond(res, workOrder, 201)
  } catch(err){
    next(err)
  }
}

async function updateWorkOrder(req, res, next){
  try{
    const workOrder = await findWorkOrder(req)
    const updates = pick(req.body, EDITABLE)
    const touchesOther = ['status', 'assignedTo', 'productId', ...DATE_FIELDS]
      .some((key) => req.body[key] !== undefined)

    if (Object.keys(updates).length === 0 && !touchesOther) {
      throw new AppError('Provide at least one field to update', 400)
    }

    workOrder.set(updates)
    applyDates(workOrder, req.body)
    applyStatus(workOrder, req.body.status)
    await applyRefs(workOrder, req.body, req.user.tenantId)
    await workOrder.save()
    await respond(res, workOrder)
  } catch(err){
    next(err)
  }
}

async function deleteWorkOrder(req, res, next){
  try{
    assertValidId(req.params.id, 'work order')
    const workOrder = await WorkOrder.findOneAndDelete({_id: req.params.id, tenantId: req.user.tenantId})
    if(!workOrder){
      throw new AppError('Work order not found', 404)
    }
    res.json({ message: 'Work order deleted' })
  }catch(err){
    next(err)
  }
}

async function addMilestone(req, res, next){
  try{
    const workOrder = await findWorkOrder(req)
    if(workOrder.milestones.length >= MAX_MILESTONES){
      throw new AppError(`A work order can have at most ${MAX_MILESTONES} milestones`, 400)
    }
    workOrder.milestones.push(milestoneInput(req.body))
    await workOrder.save()
    await respond(res, workOrder)
  } catch(err){
    next(err)
  }
}

async function updateMilestone(req, res, next){
  try{
    const workOrder = await findWorkOrder(req)
    const milestone = findMilestone(workOrder, req.params.milestoneId)
    const {title, dueDate, done} = req.body

    if(title === undefined && dueDate === undefined && done === undefined){
      throw new AppError('Provide title, dueDate or done', 400)
    }
    if(done !== undefined && typeof done !== 'boolean'){
      throw new AppError('done must be true or false', 400)
    }

    if(title !== undefined){
      milestone.title = title
    }
    if(dueDate !== undefined){
      milestone.dueDate = dateValue(dueDate)
    }
    if(done !== undefined && done !== milestone.done){
      milestone.done = done
      milestone.doneAt = done ? new Date() : null
    }

    await workOrder.save()
    await respond(res, workOrder)
  } catch (err){
    next(err)
  }
}

async function deleteMilestone(req, res, next){
  try{
    const workOrder = await findWorkOrder(req)
    findMilestone(workOrder, req.params.milestoneId)
    workOrder.milestones.pull(req.params.milestoneId)
    await workOrder.save()
    await respond(res, workOrder)
  }catch(err){
    next(err)
  }
}

module.exports = {
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  addMilestone,
  updateMilestone,
  deleteMilestone
}