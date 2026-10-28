const User = require('../models/User')
const AppError = require('../utils/AppError')
const KNOWN_ROLES = User.schema.path('role').enumValues
function requireRole(...allowedRoles){
  if(allowedRoles.length === 0){
    throw new Error('requireRole needs at least one role')
  }
  const unknownRoles = allowedRoles.filter((role) => !KNOWN_ROLES.includes(role))
  if(unknownRoles.length > 0){
    throw new Error(`requireRole got unknown role(s): ${unknownRoles.join(', ')}`)
  }
  return function checkRole(req, res, next){
    if(!req.user){
      return next(new AppError('Login required.', 401))
    }
    if(!allowedRoles.includes(req.user.role)){
      return next(new AppError('You do not have permission to access this.', 403))
    }
    next()
  }
}

module.exports = requireRole