const express = require('express')
const { listDeals } = require('../controllers/dealController')
const router = express.Router()

router.get('/', listDeals)

module.exports = router