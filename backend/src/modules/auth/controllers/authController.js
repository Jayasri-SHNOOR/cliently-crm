const User = require('../../../models/User')
const AppError = require('../../../utils/AppError')
const {sessionConfig} = require('../../../config/session')
const sessionService = require('../services/sessionService')

function refreshCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth'
  }
}

function sendSession(res, { accessToken, refreshToken, user }) {
  res.cookie(sessionConfig.refreshCookieName, refreshToken, refreshCookieOptions())
  res.json({
    accessToken,
    expiresIn: sessionConfig.accessTokenTtlSeconds,
    user
  })
}

function clearRefreshCookie(res){
  res.clearCookie(sessionConfig.refreshCookieName, refreshCookieOptions())
}

async function login(req, res, next){
  try{
    const lastLoginAt = new Date()
    await User.updateOne({_id: req.user.id}, {$set: {lastLoginAt}})
    const {accessToken, refreshToken} = await sessionService.createSession(
      { _id: req.user.id, role: req.user.role, tenantId: req.user.tenantId },
      req
    )
    sendSession(res, {accessToken, refreshToken, user: { ...req.user, lastLoginAt}})
  }catch(err){
    next(err)
  }
}

async function refresh(req, res, next){
  try{
    const presented = req.cookies?.[sessionConfig.refreshCookieName]
    if(!presented){
      throw new AppError('Please log in.', 401, 'NO_SESSION')
    }

    const session = await sessionService.findSessionByRefreshToken(presented)
    await sessionService.checkSession(session)
    const {user,tenant} = await sessionService.loadActiveAccount(session)
    const refreshToken = await sessionService.rotateRefreshToken(session)
    const accessToken = sessionService.issueAccessToken(session, user)

    sendSession(res, {accessToken, refreshToken, user: sessionService.toProfile(user, tenant)})
  }catch(err){
    if(err.statusCode === 401 || err.statusCode === 403){
      clearRefreshCookie(res)
    }
    next(err)
  }
}

async function logout(req, res, next){
  try{
    const presented = req.cookies?.[sessionConfig.refreshCookieName]
    const session = await sessionService.findSessionByRefreshToken(presented)
    await sessionService.revokeSession(session, 'logout')
    clearRefreshCookie(res)
    res.json({ message: 'Logged out' })
  }catch(err){
    next(err)
  }
}

function getMe(req, res){
  res.json({user: req.user})
}

module.exports = {login, getMe, logout, refresh}