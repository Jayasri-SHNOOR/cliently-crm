const express = require('express')
const {
  listLeads,
  getLead,
  createLead,
  updateLead,
  deleteLead
} = require('../controllers/leadController')
const router = express.Router()

router.get('/', listLeads)      
router.post('/', createLead)    
router.get('/:id', getLead)     
router.patch('/:id', updateLead) 
router.delete('/:id', deleteLead) 

module.exports = router