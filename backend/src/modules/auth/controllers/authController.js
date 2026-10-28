const User = require('../../../models/User')
const AppError = require('../../../utils/AppError')

async function login(req, res, next){
  try{
    const {selectedRole} = req.body || {}
    if(selectedRole && selectedRole !== req.user.role){
      throw new AppError(`This account is not registered as ${selectedRole}. Please choose the correct role.`, 403)
    }
    const lastLoginAt = new Date()
    await User.updateOne({_id: req.user.id}, {$set: {lastLoginAt}})

    res.json({user: {...req.user, lastLoginAt}})
  } catch(err){
    next(err)
  }
}

function getMe(req, res){
  res.json({user: req.user})
}

module.exports = {login, getMe}