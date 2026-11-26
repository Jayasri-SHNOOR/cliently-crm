const express = require('express')
const { listTeam } = require('../controllers/teamController')
const router = express.Router()

router.get('/', listTeam)

module.exports = router