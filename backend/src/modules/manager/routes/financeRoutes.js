const express = require('express')
const { getFinance } = require('../controllers/financeController')
const router = express.Router()

router.get('/', getFinance)

module.exports = router
