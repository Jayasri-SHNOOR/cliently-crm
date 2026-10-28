const Tenant = require('../models/Tenant')
let cachedTenant = null 
async function requireAuth(req, res, next) {
  try{
    if(!cachedTenant) {
      const slug = process.env.DEV_TENANT_SLUG
      cachedTenant = await Tenant.findOne({ slug }).lean()

      if(!cachedTenant) {
        return res.status(500).json({
          message: `Dev tenant "${slug}" not found. Run "npm run seed" first.`
        })
      }
    }
    req.user ={
      tenantId: cachedTenant._id,
      role: 'CLIENT_ADMIN',
      name: cachedTenant.adminName
    }
    next()
  }catch(err) {
    next(err)
  }
}

module.exports = requireAuth