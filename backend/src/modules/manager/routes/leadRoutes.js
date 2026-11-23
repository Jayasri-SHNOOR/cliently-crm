
const express = require('express')

const {
  listLeads,
  getLead,
  listAssignableExecutives,
  assignLead,
  updateLeadPriority
} = require('../controllers/leadController')

const router = express.Router()

router.get('/', listLeads)
router.get('/executives', listAssignableExecutives)
router.get('/:id', getLead)
router.patch('/:id/assign', assignLead)
router.patch('/:id/priority', updateLeadPriority)

module.exports = router
