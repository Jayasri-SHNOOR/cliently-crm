const express = require('express')
const { getMe, updateMe } = require('../controllers/meController')
const router = express.Router()

router.get('/', getMe)
router.patch('/', updateMe)

module.exports = router