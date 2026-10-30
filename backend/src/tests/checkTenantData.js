require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const Lead = require('../models/Lead')

async function main() {
  const email = process.argv[2]
  await mongoose.connect(process.env.MONGO_URI)

  const user = await User.findOne({ email }).lean()
  if (user) {
    console.log('User:', user.email, '| role:', user.role, '| tenantId:', String(user.tenantId))
  } else {
    console.log('User not found:', email)
  }

  const tenants = await Tenant.find({}, { companyName: 1, slug: 1, status: 1 }).lean()
  for (const tenant of tenants) {
    const leads = await Lead.countDocuments({ tenantId: tenant._id })
    console.log('Tenant:', String(tenant._id), '|', tenant.slug, '|', tenant.status, '| leads:', leads)
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})