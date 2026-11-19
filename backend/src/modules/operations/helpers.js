const mongoose = require('mongoose')
const AppError = require('../../utils/AppError')

function assertValidId(id, label){
  if (!mongoose.isValidObjectId(id)){
    throw new AppError(`Invalid ${label} ID`, 400)
  }
}

function parsePagination(query){
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20))
  return {page, limit, skip: (page - 1) * limit}
}

function sendPage(res, data, total, paging){
  res.json({
    data,
    pagination: {
      page: paging.page,
      limit: paging.limit,
      total,
      pages: Math.ceil(total / paging.limit)
    }
  })
}

function enumFilter(filter, field, value, allowed){
  if (value === undefined || value === '') {
    return
  }
  if(!allowed.includes(value)){
    throw new AppError(`${field} must be one of: ${allowed.join(', ')}`, 400)
  }
  filter[field] = value
}

function applyAssigneeFilter(filter, value, user){
  if(value === undefined || value === ''){
    return
  }
  if(value === 'unassigned'){
    filter.assignedTo = null
    return
  }
  if(value === 'me'){
    filter.assignedTo = user.employeeId
      ? new mongoose.Types.ObjectId(String(user.employeeId))
      : new mongoose.Types.ObjectId()
    return
  }
  if(!mongoose.isValidObjectId(value)){
    throw new AppError('assignedTo must be an employee ID, "me" or "unassigned"', 400)
  }
  filter.assignedTo = new mongoose.Types.ObjectId(value)
}

function searchRegex(value, maxLength = 100){
  if(typeof value !== 'string' || value.trim() === ''){
    return null
  }
  const text = value.trim()
  if(text.length > maxLength){
    throw new AppError(`Search must be ${maxLength} characters or less`, 400)
  }
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
}

async function refInTenant(Model, value, tenantId, label){
  if(value === null || value === ''){
    return null
  }
  if(!mongoose.isValidObjectId(value)){
    throw new AppError(`Invalid ${label} ID`, 400)
  }
  const exists = await Model.exists({_id: value, tenantId})
  if(!exists){
    throw new AppError(`${label} not found`, 400)
  }
  return value
}

module.exports = {
  assertValidId,
  parsePagination,
  sendPage,
  enumFilter,
  applyAssigneeFilter,
  searchRegex,
  refInTenant
}