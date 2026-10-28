const express = require('express')
const requireAuth = require('../../../middleware/requireAuth')
const { authLimiter } = require('../../../middleware/limiters')
const { login, getMe } = require('../controllers/authController')
const router = express.Router()

router.post('/login', authLimiter, requireAuth, login)
router.get('/me', requireAuth, getMe)

module.exports = router