const express = require('express')
const {
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  addNote,
  deleteTicket
} = require('../controllers/ticketController')
const router = express.Router()

router.get('/', listTickets)
router.post('/', createTicket)
router.get('/:id', getTicket)
router.patch('/:id', updateTicket)
router.delete('/:id', deleteTicket)
router.post('/:id/notes', addNote)

module.exports = router