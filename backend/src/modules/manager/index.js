const express = require('express')
const requireRole = require('../../middleware/requireRole')
const router = express.Router()

router.use(requireRole('MANAGER'))
router.use('/dashboard', require('./routes/dashboardRoutes'))
router.use('/leads', require('./routes/leadRoutes'))
router.use('/deals', require('./routes/dealRoutes'))
router.use('/team', require('./routes/teamRoutes'))
router.use('/quotations', require('./routes/quotationRoutes'))
module.exports = router