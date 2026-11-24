const express = require('express')
const {
  createTicket,
  listTickets,
  getTicket,
  addMessage,
  closeTicket
} = require('../controllers/supportController')
const router = express.Router()
router.get('/tickets', listTickets)
router.post('/tickets', createTicket)
router.get('/tickets/:id', getTicket)
router.post('/tickets/:id/messages', addMessage)
router.post('/tickets/:id/close', closeTicket)
module.exports = router