const express = require('express')
const { authLimiter } = require('../../../middleware/limiters')
const { checkActivation, activate, login, refresh, logout } = require('../controllers/authController')

const router = express.Router()

router.post('/activate/check', authLimiter, checkActivation)
router.post('/activate', authLimiter, activate)
router.post('/login', authLimiter, login)
router.post('/refresh', refresh)
router.post('/logout', logout)

module.exports = router