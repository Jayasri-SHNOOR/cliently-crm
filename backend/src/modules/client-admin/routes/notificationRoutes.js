const express = require('express')
const {listNotifications,markAllRead} = require('../controllers/notificationController')
const router = express.Router()

router.get('/', listNotifications)
router.post('/read-all', markAllRead)

module.exports = router