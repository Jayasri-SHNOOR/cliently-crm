const express = require('express')
const Deal = require('../../../models/Deal')
const { WORK_ORDER_STATUSES: _unused, ...workOrderModel } = {}
const {
  listWorkOrders,
  getWorkOrder,
  createWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  createFromDeal
} = require('../controllers/workOrderController')
const router = express.Router()

router.get('/', listWorkOrders)
router.post('/', createWorkOrder)
router.post('/from-deal/:dealId', createFromDeal)
router.get('/:id', getWorkOrder)
router.patch('/:id', updateWorkOrder)
router.delete('/:id', deleteWorkOrder)
router.post('/:id/milestones', addMilestone)
router.patch('/:id/milestones/:milestoneId', updateMilestone)
router.delete('/:id/milestones/:milestoneId', deleteMilestone)

module.exports = router