const AppError = require('../utils/AppError')
function requireRole(...roles){
  const allowed = roles.flat()

  return function roleGuard(req, res, next){
    if(!req.user){
      return next(new AppError('Please log in.', 401, 'NO_TOKEN'))
    }
    if(!allowed.includes(req.user.role)){
      return next(new AppError('You do not have permission to access this.', 403, 'FORBIDDEN'))
    }
    next()
  }
}

module.exports = requireRole
module.exports.requireRole = requireRole