const express = require('express')
const { listLeads, getLead, listAssignableExecutives, assignLead } = require('../controllers/leadController')
const router = express.Router()

router.get('/', listLeads)
router.get('/executives', listAssignableExecutives)   // keep above '/:id'
router.get('/:id', getLead)
router.patch('/:id/assign', assignLead)

module.exports = router