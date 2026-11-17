const express = require('express')
const router = express.Router()

const {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription
} = require('../controllers/subscriptionController')

router.get('/', listSubscriptions)
router.post('/', createSubscription)
router.get('/:id', getSubscription)
router.put('/:id', updateSubscription)
router.patch('/:id/cancel', cancelSubscription)

module.exports = router
