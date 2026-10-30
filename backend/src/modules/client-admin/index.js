const express = require('express')
const requireRole = require('../../middleware/requireRole')
const clientAdminOnly = requireRole('CLIENT_ADMIN')
const router = express.Router()

router.use('/dashboard', clientAdminOnly, require('./routes/dashboardRoutes'))
router.use('/leads', clientAdminOnly, require('./routes/leadRoutes'))
router.use('/deals', clientAdminOnly, require('./routes/dealRoutes'))
router.use('/employees', clientAdminOnly, require('./routes/employeeRoutes'))
router.use('/products', clientAdminOnly, require('./routes/productRoutes'))
router.use('/settings', clientAdminOnly, require('./routes/settingsRoutes'))
router.use('/me', clientAdminOnly, require('./routes/meRoutes'))
router.use('/search', clientAdminOnly, require('./routes/searchRoutes'))
router.use('/notifications', clientAdminOnly, require('./routes/notificationRoutes'))
router.use('/help', clientAdminOnly, require('./routes/helpRoutes'))
router.use('/support', clientAdminOnly, require('./routes/supportRoutes'))

module.exports = router