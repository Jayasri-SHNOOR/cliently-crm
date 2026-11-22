const express = require('express')
const { listQuotations } = require('../controllers/quotationController')
const router = express.Router()

router.get('/', listQuotations)

module.exports = router