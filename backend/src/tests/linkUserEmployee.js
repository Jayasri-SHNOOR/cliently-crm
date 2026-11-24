require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../models/User')
const Employee = require('../models/Employee')

async function main() {
  const [userEmail, employeeEmail] = process.argv.slice(2)
  if (!userEmail) {
    throw new Error('Usage: node src/tests/linkUserEmployee.js <login-email> [employee-email]')
  }

  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)

  const user = await User.findOne({ email: userEmail.toLowerCase().trim() })
  if (!user) throw new Error(`No login found for ${userEmail}`)
  if (!user.tenantId) throw new Error('This login does not belong to a company')

  const employee = await Employee.findOne({
    tenantId: user.tenantId,
    email: (employeeEmail || userEmail).toLowerCase().trim()
  })
  if (!employee) throw new Error(`No employee with email ${employeeEmail || userEmail} in this company`)

  user.employeeId = employee._id
  await user.save()
  console.log(`Linked ${user.email} (${user.role}) -> employee ${employee.name} (${employee.email})`)

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})