const express = require('express')

const router = express.Router()

router.use('/dashboard', require('./routes/dashboardRoutes'))
router.use('/leads', require('./routes/leadRoutes'))
router.use('/deals', require('./routes/dealRoutes'))
router.use('/settings', require('./routes/settingsRoutes'))
router.use('/me', require('./routes/meRoutes'))
router.use('/search', require('./routes/searchRoutes'))
router.use('/notifications', require('./routes/notificationRoutes'))
router.use('/help', require('./routes/helpRoutes'))
router.use('/support', require('./routes/supportRoutes'))

module.exports = router