require('dotenv').config()
const mongoose = require('mongoose')
const Tenant = require('../models/Tenant')
const User = require('../models/User')
const Employee = require('../models/Employee')

async function main() {
  const slug = process.argv[2] || 'devhub'
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)

  const tenant = await Tenant.findOne({ slug }).lean()
  if (!tenant) throw new Error(`Company "${slug}" not found`)

  const [users, employees] = await Promise.all([
    User.find({ tenantId: tenant._id }).select('name email role employeeId').lean(),
    Employee.find({ tenantId: tenant._id }).select('name email role status').lean()
  ])

  const byId = Object.fromEntries(employees.map((e) => [String(e._id), e]))

  console.log(`\nLogins in ${slug}:`)
  console.table(users.map((u) => ({
    name: u.name,
    loginEmail: u.email,
    role: u.role,
    linkedEmployee: u.employeeId ? (byId[String(u.employeeId)]?.email || 'missing record') : '-'
  })))

  console.log(`Employees in ${slug}:`)
  console.table(employees.map((e) => ({
    name: e.name,
    employeeEmail: e.email,
    role: e.role,
    status: e.status
  })))

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})