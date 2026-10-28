const Lead = require('../../../models/Lead')
const Deal = require('../../../models/Deal')
const AppError = require('../../../utils/AppError')
const escapeRegex = require('../../../utils/escapeRegex')
const MIN_LENGTH = 2
const MAX_LENGTH = 50
const LIMIT_PER_TYPE = 5

async function globalSearch(req, res, next){
  try{
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : ''
    if(query.length < MIN_LENGTH){
      throw new AppError(`Search text must be at least ${MIN_LENGTH} characters`, 400)
    }
    if(query.length > MAX_LENGTH){
      throw new AppError(`Search text must be ${MAX_LENGTH} characters or less`, 400)
    }
    const {tenantId} = req.user
    const pattern = new RegExp(escapeRegex(query), 'i')
    const [leads, deals] = await Promise.all([
      Lead.find({
        tenantId,
        $or: [{ name: pattern }, { email: pattern }, { company: pattern }]
      })
        .sort({ createdAt: -1 })
        .limit(LIMIT_PER_TYPE)
        .select('name company status')
        .lean(),
      Deal.find({
        tenantId,
        $or: [{ name: pattern }, { customer: pattern }, { product: pattern }]
      })
        .sort({ expectedClose: 1 })
        .limit(LIMIT_PER_TYPE)
        .select('name customer status')
        .lean()
    ])

    res.json({
      query,
      total: leads.length + deals.length,
      results: {
        leads: leads.map((lead) => ({
          id: lead._id,
          type: 'lead',
          title: lead.name,
          subtitle: lead.company || '',
          status: lead.status
        })),
        deals: deals.map((deal) => ({
          id: deal._id,
          type: 'deal',
          title: deal.name,
          subtitle: deal.customer,
          status: deal.status
        }))
      }
    })
  }catch(err) {
    next(err)
  }
}

module.exports = {globalSearch}