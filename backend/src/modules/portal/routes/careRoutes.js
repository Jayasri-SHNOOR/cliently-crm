const express = require('express')
const care = require('../controllers/careController')

const router = express.Router()

router.get('/products', care.listProducts)
router.get('/service-types', care.serviceTypes)
router.get('/service-requests', care.listRequests)
router.post('/service-requests', care.createRequest)
router.get('/service-requests/:id', care.getRequest)
router.post('/service-requests/:id/cancel', care.cancelRequest)

module.exports = router