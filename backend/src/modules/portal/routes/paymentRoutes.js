const express = require('express')
const { verifyPayment, reportFailure } = require('../controllers/orderController')

const router = express.Router()

router.post('/verify', verifyPayment)
router.post('/failed', reportFailure)

module.exports = router