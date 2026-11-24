const Tenant = require('../../../models/Tenant')
const AppError = require('../../../utils/AppError')

function initialsOf(name){
  return name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function getMe(req, res, next){
  try{
    const tenant = await Tenant.findById(req.user.tenantId)
      .select('companyName plan')
      .lean()
    if(!tenant){
      throw new AppError('Company not found', 404)
    }
    res.json({
      name: req.user.name,
      initials: initialsOf(req.user.name),
      role: req.user.role,
      roleLabel: req.user.role === 'CLIENT_ADMIN' ? 'Admin' : 'User',
      company: {
        id: tenant._id,
        name: tenant.companyName,
        plan: tenant.plan
      }
    })
  }catch(err) {
    next(err)
  }
}

module.exports = { getMe }