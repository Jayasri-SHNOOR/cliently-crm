const {getAuth} = require('firebase-admin/auth')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const AppError = require('../utils/AppError')
function readBearerToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if(scheme !== 'Bearer' || !token) {
    throw new AppError('Login required. Send the token as "Authorization: Bearer <token>".', 401)
  }
  return token
}

async function verifyFirebaseToken(token){
  try{
    return await getAuth().verifyIdToken(token)
  }catch(err){
    if(err.code === 'auth/id-token-expired'){
      throw new AppError('Your session has expired. Please log in again.', 401)
    }
    throw new AppError('Invalid login token. Please log in again.', 401)
  }
}

async function requireFirebaseAuth(req, res, next){
  try{
    const token = readBearerToken(req)
    const decoded = await verifyFirebaseToken(token)
    const user = await User.findOne({firebaseUid: decoded.uid}).lean()
    if(!user){
      throw new AppError('No CRM account is linked to this login. Contact your administrator.', 403)
    }
    if(user.status !== 'Active'){
      throw new AppError('Your account is inactive. Contact your administrator.', 403)
    }

    let tenant = null
    if(user.role !== 'SUPER_ADMIN'){
      tenant = await Tenant.findById(user.tenantId).lean()
      if(!tenant || tenant.status !== 'Active'){
        throw new AppError('Your company account is not active. Contact NexaSoft support.', 403)
      }
    }
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      tenantId: tenant ? tenant._id : null,
      company: tenant ? { id: tenant._id, name: tenant.companyName, slug: tenant.slug } : null,
      employeeId: user.employeeId || null,
      lastLoginAt: user.lastLoginAt || null
    }

    next()
  }catch(err){
    next(err)
  }
}
module.exports = requireFirebaseAuth