const express = require('express')
const {
  getCompany,
  updateCompany,
  getBilling,
  listPlans,
  getInvoice,
  updatePaymentMethod,
  getPublicSite,
  updatePublicSite
} = require('../controllers/settingsController')
const {
  listUsers,
  listRoles,
  updateRole,
  deactivateUser,
  activateUser
} = require('../controllers/usersController')

const router = express.Router()

router.get('/company', getCompany)
router.patch('/company', updateCompany)

router.get('/billing', getBilling)
router.get('/billing/plans', listPlans)
router.get('/billing/invoices/:id', getInvoice)
router.patch('/billing/payment-method', updatePaymentMethod)

router.get('/users', listUsers)
router.get('/roles', listRoles)
router.patch('/users/:id/role', updateRole)
router.post('/users/:id/deactivate', deactivateUser)
router.post('/users/:id/activate', activateUser)

router.get('/public-site', getPublicSite)
router.patch('/public-site', updatePublicSite)

module.exports = router