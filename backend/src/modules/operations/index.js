const express = require('express')
const { getStaff, getProducts } = require('./controllers/sharedController')
const router = express.Router()

router.get('/staff', getStaff)
router.get('/products', getProducts)
router.use('/tickets', require('./routes/ticketRoutes'))
router.use('/work-orders', require('./routes/workOrderRoutes'))

module.exports = router