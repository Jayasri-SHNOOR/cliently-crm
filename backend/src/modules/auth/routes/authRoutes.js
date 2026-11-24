const express = require('express')
const requireFirebaseAuth = require('../../../middleware/requireFirebaseAuth')
const requireSession = require('../../../middleware/requireSession')
const {authLimiter} = require('../../../middleware/limiters')
const {login, getMe, logout, refresh } = require('../controllers/authController')
const router = express.Router()

router.post('/login', authLimiter, requireFirebaseAuth, login)
router.post('/refresh', refresh)
router.post('/logout', logout)
router.get('/me', requireSession, getMe)

module.exports = router