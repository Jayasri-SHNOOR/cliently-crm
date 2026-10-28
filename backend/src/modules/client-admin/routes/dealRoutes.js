const express = require('express')
const {
  listDeals,
  getDeal,
  createDeal,
  updateDeal,
  deleteDeal,
  addActivity
} = require('../controllers/dealController')
const router = express.Router()

router.get('/', listDeals)
router.post('/', createDeal)
router.get('/:id', getDeal)
router.patch('/:id', updateDeal)
router.delete('/:id', deleteDeal)
router.post('/:id/activities', addActivity)

module.exports = router