const mongoose = require('mongoose')
const Deal = require('../../../models/Deal')
const {CLOSED_STATUSES} = require('../../../models/Deal')
const AppError = require('../../../utils/AppError')
const escapeRegex = require('../../../utils/escapeRegex')
const pick = require('../../../utils/pick')
const ALLOWED_FIELDS = ['name', 'customer', 'product', 'value', 'status', 'assignedTo', 'expectedClose']
function formatDeal(deal) {
  return{
    id: deal._id,
    name: deal.name,
    customer: deal.customer,
    product: deal.product,
    value: deal.value,
    status: deal.status,
    assignedTo: deal.assignedTo,
    expectedClose: deal.expectedClose,
    activities: deal.activities,
    createdAt: deal.createdAt
  }
}

async function getSummary(tenantId) {
  // aggregate() does not auto-cast strings to ObjectId like find() does
  const result = await Deal.aggregate([
    { $match:{ tenantId: new mongoose.Types.ObjectId(tenantId) } },
    {
      $group:{
        _id: null,
        totalDeals: { $sum: 1 },
        inProgress: {
          $sum: { $cond: [{ $in: ['$status', CLOSED_STATUSES] }, 0, 1] }
        },
        won: {
          $sum: { $cond: [{ $eq: ['$status', 'Won'] }, 1, 0] }
        },
        totalValue: { $sum: '$value' }
      }
    }
  ])
  return result[0]
    ? {
        totalDeals: result[0].totalDeals,
        inProgress: result[0].inProgress,
        won: result[0].won,
        totalValue: result[0].totalValue
      }
    : { totalDeals: 0, inProgress: 0, won: 0, totalValue: 0 }
}

async function listDeals(req, res, next) {
  try{
    const{ status, product, assignedTo, search } = req.query
    const{ tenantId } = req.user
    const filter = { tenantId }
    if(status) filter.status = status
    if(product) filter.product = product
    if(assignedTo) filter.assignedTo = assignedTo
    if(search) {
      const pattern = new RegExp(escapeRegex(search), 'i')
      filter.$or = [
        { name: pattern },
        { customer: pattern },
        { product: pattern }
      ]
    }

    const [deals, summary] = await Promise.all([
      Deal.find(filter).sort({ expectedClose: 1 }).lean(),
      getSummary(tenantId)
    ])
    res.json({
      summary,
      count: deals.length,
      deals: deals.map(formatDeal)
    })
  }catch(err) {
    next(err)
  }
}

async function getDeal(req, res, next) {
  try{
    const deal = await Deal.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).lean()
    if(!deal) {
      throw new AppError('Deal not found', 404)
    }
    res.json(formatDeal(deal))
  }catch(err) {
    next(err)
  }
}

async function createDeal(req, res, next) {
  try{
    const data = pick(req.body, ALLOWED_FIELDS)
    const deal = await Deal.create({
      ...data,
      activities: ['Deal created'],
      tenantId: req.user.tenantId
    })
    res.status(201).json(formatDeal(deal))
  }catch(err){
    next(err)
  }
}

async function updateDeal(req, res, next) {
  try{
    const updates = pick(req.body, ALLOWED_FIELDS)
    if(Object.keys(updates).length === 0){
      throw new AppError('No valid fields to update', 400)
    }
    const operation = { $set: updates }
    if(updates.status){
      operation.$push = {
        activities: { $each: [`Status changed to ${updates.status}`], $position: 0 }
      }
    }

    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      operation,
      { returnDocument: 'after', runValidators: true }
    ).lean()

    if(!deal){
      throw new AppError('Deal not found', 404)
    }

    res.json(formatDeal(deal))
  }catch(err) {
    next(err)
  }
}

async function deleteDeal(req, res, next) {
  try {
    const deal = await Deal.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })
    if (!deal) {
      throw new AppError('Deal not found', 404)
    }
    res.json({ message: 'Deal deleted', id: deal._id })
  }catch(err) {
    next(err)
  }
}

async function addActivity(req, res, next) {
  try{
    const { text } = req.body
    if(typeof text !== 'string' || text.trim() === '') {
      throw new AppError('Activity text is required', 400)
    }
    if(text.length > 200){
      throw new AppError('Activity text must be 200 characters or less', 400)
    }
    const deal = await Deal.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $push: { activities: { $each: [text.trim()], $position: 0 } } },
      { returnDocument: 'after' }
    ).lean()
    if(!deal){
      throw new AppError('Deal not found', 404)
    }
    res.status(201).json(formatDeal(deal))
  }catch(err){
    next(err)
  }
}
module.exports = {listDeals,getDeal,createDeal,updateDeal,deleteDeal,addActivity}