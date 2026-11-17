const mongoose = require('mongoose')
const Ticket = require('../../../models/Ticket')
const WorkOrder = require('../../../models/WorkOrder')
const KbArticle = require('../../../models/KbArticle')
const Asset = require('../../../models/Asset')
const AppError = require('../../../utils/AppError')
const {searchRegex} = require('../helpers')
const {presentWorkOrder, startOfToday} = require('./workOrderController')

const DAY_MS = 24 * 60 * 60 * 1000
const ACTIVE_TICKET_STATUSES = ['Open', 'In Progress', 'Waiting on Customer']
const CLOSED_WORK_ORDER_STATUSES = ['Completed', 'Cancelled']
const LIST_SIZE = 5
const SEARCH_SIZE = 5

function countOf(groups, status){
  const group = groups.find((item) => item._id === status)
  return group ? group.count : 0
}

function single(rows, field){
  return rows.length > 0 ? rows[0][field] : 0
}

function toObjectId(id){
  return new mongoose.Types.ObjectId(String(id))
}

async function ticketStats(tenantId){
  const now = Date.now()
  const [result] = await Ticket.aggregate([
    {$match: {tenantId}},
    {
      $facet: {
        byStatus: [{$group: {_id: '$status', count: {$sum: 1}}}],
        urgentOpen: [
          {$match: {priority: 'Urgent', status: {$in: ACTIVE_TICKET_STATUSES}}},
          {$count: 'n'}
        ],
        resolvedRecent: [
          {$match: {resolvedAt: {$gte: new Date(now - 7 * DAY_MS)}}},
          {$count: 'n'}
        ],
        resolution: [
          {$match: {resolvedAt: {$gte: new Date(now - 30 * DAY_MS)}}},
          {$group: {_id: null, avgMs: {$avg: {$subtract: ['$resolvedAt', '$createdAt']}}}}
        ]
      }
    }
  ])

  const avgMs = result.resolution.length > 0 ? result.resolution[0].avgMs : null
  return{
    open: countOf(result.byStatus, 'Open'),
    inProgress: countOf(result.byStatus, 'In Progress'),
    waitingOnCustomer: countOf(result.byStatus, 'Waiting on Customer'),
    urgentOpen: single(result.urgentOpen, 'n'),
    resolvedLast7Days: single(result.resolvedRecent, 'n'),
    avgResolutionHours: avgMs === null ? null : Math.round((avgMs / 3600000) * 10) / 10
  }
}

async function workOrderStats(tenantId){
  const [result] = await WorkOrder.aggregate([
    {$match:{tenantId}},
    {
      $facet: {
        byStatus: [{$group: {_id:'$status',count: {$sum: 1}}}],
        overdue: [
          {$match: {dueDate: {$lt: startOfToday()}, status: {$nin: CLOSED_WORK_ORDER_STATUSES}}},
          {$count: 'n'}
        ],
        completedRecent: [
          {$match: {completedAt: {$gte: new Date(Date.now() - 30 * DAY_MS)}}},
          {$count: 'n'}
        ]
      }
    }
  ])

  return{
    planned: countOf(result.byStatus, 'Planned'),
    inProgress: countOf(result.byStatus, 'In Progress'),
    onHold: countOf(result.byStatus, 'On Hold'),
    overdue: single(result.overdue, 'n'),
    completedLast30Days: single(result.completedRecent, 'n')
  }
}

async function assetStats(tenantId){
  const [result] = await Asset.aggregate([
    {$match: {tenantId}},
    {
      $facet:{
        byStatus: [{$group: {_id: '$status', count: {$sum: 1}}}],
        total: [{$count: 'n'}],
        lowStock: [
          {$match: {status: {$ne: 'Retired'}, $expr: {$lte: ['$quantity', '$reorderLevel']}}},
          {$count: 'n'}
        ]
      }
    }
  ])

  return{
    total: single(result.total, 'n'),
    inStock: countOf(result.byStatus, 'In Stock'),
    assigned: countOf(result.byStatus, 'Assigned'),
    lowStock: single(result.lowStock, 'n')
  }
}

async function articleStats(tenantId){
  const groups = await KbArticle.aggregate([
    {$match: {tenantId}},
    {$group: {_id: '$status', count: {$sum: 1}}}
  ])
  return{
    published: countOf(groups, 'Published'),
    drafts: countOf(groups, 'Draft')
  }
}

async function upcomingWorkOrders(tenantId){
  const rows = await WorkOrder.aggregate([
    {$match: {tenantId, status: {$nin: CLOSED_WORK_ORDER_STATUSES}}},
    {$addFields: {noDueDate: {$cond: [{$eq: [{$ifNull: ['$dueDate', null]}, null]}, 1, 0]}}},
    {$sort: {noDueDate: 1, dueDate: 1, createdAt: -1}},
    {$limit: LIST_SIZE},
    {$project: {number: 1, title: 1, dueDate: 1, status: 1, milestones: 1}}
  ])

  return rows.map((row) =>{
    const {_id, number, title, dueDate, status, progress, overdue} = presentWorkOrder(row, {list: true})
    return {_id, number, title, dueDate, status, progress, overdue}
  })
}

async function getOperationsSummary(tenantId){
  const id = toObjectId(tenantId)
  const [tickets, workOrders, assets] = await Promise.all([
    ticketStats(id),
    workOrderStats(id),
    assetStats(id)
  ])

  return{
    openTickets: tickets.open + tickets.inProgress + tickets.waitingOnCustomer,
    urgentTickets: tickets.urgentOpen,
    resolvedLast7Days: tickets.resolvedLast7Days,
    avgResolutionHours: tickets.avgResolutionHours,
    activeWorkOrders: workOrders.planned + workOrders.inProgress + workOrders.onHold,
    overdueWorkOrders: workOrders.overdue,
    completedWorkOrdersLast30Days: workOrders.completedLast30Days,
    lowStockAssets: assets.lowStock
  }
}

async function getDashboard(req, res, next){
  try{
    const tenantId = toObjectId(req.user.tenantId)
    const [tickets, workOrders, assets, knowledgeBase, recentTickets, upcoming, lowStockAssets] = await Promise.all([
      ticketStats(tenantId),
      workOrderStats(tenantId),
      assetStats(tenantId),
      articleStats(tenantId),
      Ticket.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(LIST_SIZE)
        .select('number subject customer.name priority status createdAt')
        .lean(),
      upcomingWorkOrders(tenantId),
      Asset.find({
        tenantId,
        status: {$ne: 'Retired'},
        $expr: {$lte: ['$quantity', '$reorderLevel']}
      })
        .sort({quantity: 1, name: 1})
        .limit(LIST_SIZE)
        .select('name quantity reorderLevel unit')
        .lean()
    ])

    res.json({
      data: {
        tickets,
        workOrders,
        assets,
        knowledgeBase,
        recentTickets,
        upcomingWorkOrders: upcoming,
        lowStockAssets
      }
    })
  }catch(err){
    next(err)
  }
}

async function searchAll(req, res, next){
  try{
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if(q.length < 2){
      throw new AppError('Search must be at least 2 characters', 400)
    }
    const regex = searchRegex(q, 50)
    const tenantId = req.user.tenantId

    const [tickets, workOrders, articles, assets] = await Promise.all([
      Ticket.find({tenantId, $or: [{subject: regex}, {'customer.name': regex}, {'customer.company': regex }]})
        .sort({ createdAt: -1 })
        .limit(SEARCH_SIZE)
        .select('number subject status')
        .lean(),
      WorkOrder.find({tenantId, $or: [{title: regex}, {'customer.name': regex}, {'customer.company': regex }]})
        .sort({createdAt: -1})
        .limit(SEARCH_SIZE)
        .select('number title status')
        .lean(),
      KbArticle.find({tenantId, $or: [{title: regex}, {tags: regex}]})
        .sort({updatedAt: -1})
        .limit(SEARCH_SIZE)
        .select('title status')
        .lean(),
      Asset.find({tenantId, $or: [{name: regex}, {code: regex}, {serialNumber: regex}]})
        .sort({createdAt: -1})
        .limit(SEARCH_SIZE)
        .select('name status')
        .lean()
    ])

    res.json({data: {tickets, workOrders, articles, assets}})
  }catch(err){
    next(err)
  }
}

module.exports = {getDashboard, searchAll, getOperationsSummary}