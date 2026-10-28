const Lead = require('../../../models/Lead')
const AppError = require('../../../utils/AppError')
const pick = require('../../../utils/pick')
const escapeRegex = require('../../../utils/escapeRegex')
const ALLOWED_FIELDS = ['name', 'email', 'company', 'phone', 'status', 'value', 'productInterested', 'executive']
function formatLead(lead) {
  return{
    id: lead._id,
    name: lead.name,
    email: lead.email,
    company: lead.company,
    phone: lead.phone,
    status: lead.status,
    value: lead.value,
    productInterested: lead.productInterested,
    executive: lead.executive,
    createdAt: lead.createdAt
  }
}

async function listLeads(req, res, next) {
  try{
    const { status, executive, search } = req.query
    const filter = { tenantId: req.user.tenantId }
    if(status) filter.status = status
    if(executive) filter.executive = executive
    if(search) {
      const pattern = new RegExp(escapeRegex(search), 'i') 
      filter.$or = [
        { name: pattern },
        { email: pattern },
        { company: pattern }
      ]
    }
    const leads = await Lead.find(filter).sort({ createdAt: -1 }).lean()
    res.json({
      count:leads.length,
      leads:leads.map(formatLead)
    })
  }catch(err) {
    next(err)
  }
}

async function getLead(req, res, next) {
  try{
    const lead = await Lead.findOne({
      _id: req.params.id,
      tenantId: req.user.tenantId
    }).lean()

    if(!lead) {
      throw new AppError('Lead not found', 404)
    }
    res.json(formatLead(lead))
  }catch(err) {
    next(err)
  }
}

async function createLead(req, res, next) {
    try{
      const data = pick(req.body, ALLOWED_FIELDS)
      const lead = await Lead.create({
        ...data,
        tenantId: req.user.tenantId 
      })
  
    res.status(201).json(formatLead(lead))
    }catch(err) {
      next(err)
    }
  }
async function updateLead(req, res, next) {
    try{
      const updates = pick(req.body, ALLOWED_FIELDS)
  
      if(Object.keys(updates).length === 0) {
        throw new AppError('No valid fields to update', 400)
      }
  
      const lead = await Lead.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.user.tenantId },
        updates,
        {
          returnDocument: 'after', 
          runValidators: true 
        }
      ).lean()
  
      if(!lead) {
        throw new AppError('Lead not found', 404)
      }
  
      res.json(formatLead(lead))
    }catch(err) {
      next(err)
    }
  }
  async function deleteLead(req, res, next) {
    try{
      const lead = await Lead.findOneAndDelete({
        _id: req.params.id,
        tenantId: req.user.tenantId
      })
  
      if(!lead) {
        throw new AppError('Lead not found', 404)
      }
  
      res.json({ message: 'Lead deleted', id: lead._id })
    }catch(err) {
      next(err)
    }
  }
module.exports={listLeads,getLead,createLead,updateLead,deleteLead}

