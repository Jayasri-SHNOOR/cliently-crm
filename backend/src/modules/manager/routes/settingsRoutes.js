const express = require('express')

const {
  getProfile,
  updateProfile,
  getNotifications,
  updateNotifications,
} = require('../controllers/settingsController')

const router = express.Router()

router.get('/profile', getProfile)
router.patch('/profile', updateProfile)

router.get('/notifications', getNotifications)
router.patch('/notifications', updateNotifications)

module.exports = router
