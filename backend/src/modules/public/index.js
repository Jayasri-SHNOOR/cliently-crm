const express = require('express')
const enquiryLimiter = require('./enquiryLimiter')
const { getSite, submitEnquiry } = require('./controllers/siteController')

const router = express.Router()

router.get('/sites/:slug', getSite)
router.post('/sites/:slug/enquiries', enquiryLimiter, submitEnquiry)

module.exports = router