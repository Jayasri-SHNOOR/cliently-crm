const Asset = require('../../../models/Asset')
const Product = require('../../../models/Product')
const WorkOrder = require('../../../models/WorkOrder')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const {ASSET_TYPES, ASSET_STATUSES} = require('../../../models/Asset')
const {
  assertValidId,
  parsePagination,
  sendPage,
  enumFilter,
  searchRegex,
  refInTenant
} = require('../helpers')

const POPULATE = [
  {path: 'productId', select: 'name'},
  {path: 'assignment.workOrderId', select: 'number title'}
]
const EDITABLE = ['name', 'type', 'category', 'unit', 'reorderLevel', 'serialNumber', 'location', 'notes']
const DATE_FIELDS = ['purchaseDate', 'warrantyUntil']
const SORTS = {
  newest: {createdAt: -1},
  name: {name: 1},
  quantity: {quantity: 1, name: 1}
}
const MAX_CHANGE = 100000

function present(source){
  const asset = typeof source.toObject === 'function'
    ? source.toObject({virtuals: false})
    : {...source}
  asset.lowStock = asset.status !== 'Retired' && asset.quantity <= asset.reorderLevel
  return asset
}

function emptyToNull(value){
  return value === '' ? null : value
}

function applyFields(asset, body){
  asset.set(pick(body, EDITABLE))

  if(body.code !== undefined){
    const code = typeof body.code === 'string' ? body.code.trim() : body.code
    asset.code = code === '' || code === null ? undefined : code
  }
  if(body.cost !== undefined){
    asset.cost = emptyToNull(body.cost)
  }
  DATE_FIELDS.forEach((field) => {
    if(body[field] !== undefined){
      asset[field] = emptyToNull(body[field])
    }
  })
}

function applyStatus(asset, status){
  if(status === undefined || status === asset.status){
    return
  }
  if(status === 'Assigned'){
    throw new AppError('Use the assign action to assign an asset', 400)
  }
  asset.status = status
  asset.assignment = null
}

async function findAsset(req){
  assertValidId(req.params.id, 'asset')
  const asset = await Asset.findOne({ _id: req.params.id, tenantId: req.user.tenantId })
  if(!asset){
    throw new AppError('Asset not found', 404)
  }
  return asset
}

async function respond(res, asset, status = 200){
  await asset.populate(POPULATE)
  res.status(status).json({data: present(asset)})
}

async function listAssets(req, res, next){
  try{
    const filter = {tenantId: req.user.tenantId}
    enumFilter(filter, 'status', req.query.status, ASSET_STATUSES)
    enumFilter(filter, 'type', req.query.type, ASSET_TYPES)

    if (req.query.lowStock === 'true'){
      filter.$expr = {$lte: ['$quantity', '$reorderLevel']}
      filter.$and = [{status: {$ne: 'Retired'}}]
    }

    const regex = searchRegex(req.query.q)
    if(regex){
      filter.$or = [{name: regex}, {code: regex }, {serialNumber: regex}, {category: regex}]
    }

    const sortKey = req.query.sort || 'newest'
    const sort = SORTS[sortKey]
    if(!sort){
      throw new AppError(`sort must be one of: ${Object.keys(SORTS).join(', ')}`, 400)
    }

    const paging = parsePagination(req.query)
    const [rows, total] = await Promise.all([
      Asset.find(filter)
        .sort(sort)
        .collation({ locale: 'en', strength: 2 })
        .skip(paging.skip)
        .limit(paging.limit)
        .populate(POPULATE)
        .lean(),
      Asset.countDocuments(filter)
    ])

    sendPage(res, rows.map(present), total, paging)
  }catch(err){
    next(err)
  }
}

async function getAsset(req, res, next){
  try{
    const asset = await findAsset(req)
    await respond(res, asset)
  }catch(err){
    next(err)
  }
}

async function createAsset(req, res, next){
  try{
    const asset = new Asset({tenantId: req.user.tenantId})
    applyFields(asset, req.body)

    if(req.body.quantity !== undefined){
      asset.quantity = req.body.quantity
    }
    if(req.body.status !== undefined){
      applyStatus(asset, req.body.status)
    }
    if(req.body.productId !== undefined){
      asset.productId = await refInTenant(Product, req.body.productId, req.user.tenantId, 'Product')
    }

    await asset.save()
    await respond(res, asset, 201)
  }catch(err){
    next(err)
  }
}

async function updateAsset(req, res, next){
  try{
    const asset = await findAsset(req)

    if(req.body.quantity !== undefined){
      throw new AppError('Use the adjust-stock action to change the quantity', 400)
    }

    const keys = [...EDITABLE, 'code', 'cost', 'status', 'productId', ...DATE_FIELDS]
    if(!keys.some((key) => req.body[key] !== undefined)){
      throw new AppError('Provide at least one field to update', 400)
    }

    applyFields(asset, req.body)
    applyStatus(asset, req.body.status)
    if(req.body.productId !== undefined){
      asset.productId = await refInTenant(Product, req.body.productId, req.user.tenantId, 'Product')
    }

    await asset.save()
    await respond(res, asset)
  }catch(err){
    next(err)
  }
}

async function assignAsset(req, res, next){
  try{
    const asset = await findAsset(req)
    if(asset.status === 'Retired'){
      throw new AppError('A retired asset cannot be assigned', 400)
    }

    const customerName = typeof req.body.customerName === 'string' ? req.body.customerName.trim() : ''
    const hasWorkOrder = req.body.workOrderId !== undefined && req.body.workOrderId !== null && req.body.workOrderId !== ''
    if(!customerName && !hasWorkOrder){
      throw new AppError('Provide a customer name or a work order', 400)
    }

    let workOrder = null
    if(hasWorkOrder){
      const workOrderId = await refInTenant(WorkOrder, req.body.workOrderId, req.user.tenantId, 'Work order')
      workOrder = await WorkOrder.findById(workOrderId).select('customer').lean()
    }

    asset.assignment = {
      customerName: customerName || workOrder?.customer?.name || '',
      workOrderId: workOrder ? workOrder._id : null,
      assignedAt: new Date()
    }
    asset.status = 'Assigned'

    await asset.save()
    await respond(res, asset)
  }catch(err){
    next(err)
  }
}

async function unassignAsset(req, res, next){
  try{
    const asset = await findAsset(req)
    if(asset.status !== 'Assigned'){
      throw new AppError('This asset is not assigned', 400)
    }
    asset.status = 'In Stock'
    asset.assignment = null

    await asset.save()
    await respond(res, asset)
  }catch(err){
    next(err)
  }
}

async function adjustStock(req, res, next){
  try{
    assertValidId(req.params.id, 'asset')
    const change = req.body.change

    if(!Number.isInteger(change) || change === 0){
      throw new AppError('change must be a whole number other than 0', 400)
    }
    if(Math.abs(change) > MAX_CHANGE){
      throw new AppError(`change must be between -${MAX_CHANGE} and ${MAX_CHANGE}`, 400)
    }

    const scope = {_id: req.params.id, tenantId: req.user.tenantId}
    const filter = change < 0 ? {...scope, quantity: {$gte: -change}} : scope
    const asset = await Asset.findOneAndUpdate(
      filter,
      {$inc: {quantity: change}},
      {returnDocument: 'after'}
    )

    if(!asset){
      const exists = await Asset.exists(scope)
      if(!exists){
        throw new AppError('Asset not found', 404)
      }
      throw new AppError('Quantity cannot go below 0', 400)
    }

    await respond(res, asset)
  }catch(err){
    next(err)
  }
}

async function deleteAsset(req, res, next){
  try{
    assertValidId(req.params.id, 'asset')
    const asset = await Asset.findOneAndDelete({_id: req.params.id, tenantId: req.user.tenantId})
    if(!asset){
      throw new AppError('Asset not found', 404)
    }
    res.json({message: 'Asset deleted'})
  }catch(err){
    next(err)
  }
}

module.exports = {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  assignAsset,
  unassignAsset,
  adjustStock,
  deleteAsset
}