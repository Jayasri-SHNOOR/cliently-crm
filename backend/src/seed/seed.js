require('dotenv').config()
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const Tenant = require('../models/Tenant')
const Lead = require('../models/Lead')
const Deal = require('../models/Deal')
const Invoice = require('../models/Invoice')
const data = require('./data')

async function seed() {
  await connectDB()
  await Invoice.init()
  const tenant = await Tenant.findOneAndUpdate(
    { slug: data.tenant.slug },
    data.tenant,
    { upsert: true, returnDocument: 'after' }
  )
  console.log(`Tenant ready: ${tenant.companyName} (${tenant._id})`)
  const oldLeads = await Lead.deleteMany({ tenantId: tenant._id })
  const oldDeals = await Deal.deleteMany({ tenantId: tenant._id })
  const oldInvoices = await Invoice.deleteMany({ tenantId: tenant._id })
  console.log(`Removed old data: ${oldLeads.deletedCount} leads, ${oldDeals.deletedCount} deals, ${oldInvoices.deletedCount} invoices`)
  const now = Date.now()
  const leads = data.leads.map(({ minutesAgo, ...lead }) => {
    const createdAt = new Date(now - minutesAgo * 60 * 1000)
    return { ...lead, tenantId: tenant._id, createdAt, updatedAt: createdAt }
  })
  await Lead.insertMany(leads, { timestamps: false })
  const deals = data.deals.map((deal) => ({ ...deal, tenantId: tenant._id }))
  await Deal.insertMany(deals)
  const invoices = data.invoices.map((invoice) => ({ ...invoice, tenantId: tenant._id }))
  await Invoice.insertMany(invoices)
  console.log(`Inserted ${leads.length} leads, ${deals.length} deals and ${invoices.length} invoices`)
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())