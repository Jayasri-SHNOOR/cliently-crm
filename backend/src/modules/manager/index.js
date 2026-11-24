const express = require('express')
const requireRole = require('../../middleware/requireRole')
const router = express.Router()

router.use(requireRole('MANAGER', 'CLIENT_ADMIN'))
router.use('/dashboard', require('./routes/dashboardRoutes'))
router.use('/leads', require('./routes/leadRoutes'))
router.use('/deals', require('./routes/dealRoutes'))
router.use('/team', require('./routes/teamRoutes'))
router.use('/reports', require('./routes/reportRoutes'))
router.use('/quotations', require('./routes/quotationRoutes'))
module.exports = router