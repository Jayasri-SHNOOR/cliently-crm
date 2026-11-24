require('dotenv').config()
const mongoose = require('mongoose')
const Tenant = require('../models/Tenant')
const Customer = require('../models/Customer')
const CustomerAccount = require('../models/CustomerAccount')
const { issuePortalAccess } = require('../utils/customerAccess')

async function listCustomers(tenant) {
  const [customers, accounts] = await Promise.all([
    Customer.find({ tenantId: tenant._id }).sort({ createdAt: -1 }).limit(30).lean(),
    CustomerAccount.find({ tenantId: tenant._id }).lean()
  ])
  const byCustomer = Object.fromEntries(accounts.map((a) => [String(a.customerId), a]))

  console.log(`\nCustomers in ${tenant.slug} (newest first):`)
  console.table(customers.map((c) => ({
    customerCode: c.customerCode || '(none)',
    name: c.name,
    owner: c.ownerName || '-',
    fromQuotation: c.leadId ? 'yes' : 'no',
    portalLoginId: byCustomer[String(c._id)]?.loginId || '-',
    portalStatus: byCustomer[String(c._id)]?.status || 'no account'
  })))
  console.log('Run again with a customerCode, e.g. node src/tests/issuePortalLink.js CUST-0001 devhub\n')
}

async function main() {
  const [customerCode, slug = 'devhub'] = process.argv.slice(2)
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)

  const tenant = await Tenant.findOne({ slug }).lean()
  if (!tenant) throw new Error(`Company "${slug}" not found`)

  if (!customerCode || customerCode === 'list') {
    await listCustomers(tenant)
    return mongoose.disconnect()
  }

  const customer = await Customer.findOne({ tenantId: tenant._id, customerCode: customerCode.toUpperCase() }).lean()
  if (!customer) {
    console.log(`Customer ${customerCode} not found in ${slug}.`)
    await listCustomers(tenant)
    return mongoose.disconnect()
  }

  const portal = await issuePortalAccess({ tenantId: tenant._id, customerId: customer._id })

  console.log(`\nCustomer : ${customer.name} (${customer.customerCode})`)
  console.log(`Login ID : ${portal.loginId}`)
  console.log(`Status   : ${portal.status}`)
  console.log(`Expires  : ${portal.expiresAt.toLocaleString('en-IN')}`)
  console.log(`\nActivation link:\n${portal.activationLink}\n`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})