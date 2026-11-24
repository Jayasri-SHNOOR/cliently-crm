const express = require('express')
const requireCustomerSession = require('../../middleware/requireCustomerSession')
const { me } = require('./controllers/authController')

const router = express.Router()

router.use('/auth', require('./routes/authRoutes'))
router.use(requireCustomerSession)
router.get('/me', me)
router.use((req, res) => res.status(404).json({ message: 'Not found' }))

module.exports = router