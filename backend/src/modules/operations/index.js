const express = require('express')
const { getStaff, getProducts } = require('./controllers/sharedController')
const { getDashboard, searchAll } = require('./controllers/dashboardController')
const { listWonDeals } = require('./controllers/workOrderController')
const router = express.Router()

router.get('/staff', getStaff)
router.get('/products', getProducts)
router.get('/dashboard', getDashboard)
router.get('/search', searchAll)
router.use('/tickets', require('./routes/ticketRoutes'))
router.use('/work-orders', require('./routes/workOrderRoutes'))
router.use('/kb-articles', require('./routes/kbRoutes'))
router.use('/assets', require('./routes/assetRoutes'))
router.get('/won-deals', listWonDeals)

module.exports = router