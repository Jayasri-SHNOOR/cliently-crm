const mongoose = require('mongoose')

const APPLY = process.argv.includes('--apply')
const tenantArg = process.argv.find((a) => a.startsWith('--tenant='))?.split('=')[1]

async function main() {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI
  if (!uri) throw new Error('No MONGO_URI / MONGODB_URI found in .env. Check the variable name in src/config/db.js')

  await mongoose.connect(uri)
  const db = mongoose.connection.db
  console.log(`Connected to database: ${db.databaseName}`)
  console.log(APPLY ? 'MODE: APPLY (changes will be saved)\n' : 'MODE: DRY RUN (nothing is changed)\n')

  // 1. which tenant?
    const tenants = await db.collection('tenants').find({}).toArray()
  console.log('Tenants found:')
  for (const t of tenants) {
    const { _id, ...rest } = t
    const [leads, employees, users, deals] = await Promise.all(
      ['leads', 'employees', 'users', 'deals'].map((c) => db.collection(c).countDocuments({ tenantId: _id }))
    )
    console.log(`  ${_id}`)
    console.log(`    ${JSON.stringify(rest).slice(0, 150)}`)
    console.log(`    leads=${leads} employees=${employees} users=${users} deals=${deals}`)
  }

  let tenantId
  if (tenantArg) {
    tenantId = new mongoose.Types.ObjectId(tenantArg)
  } else if (tenants.length === 1) {
    tenantId = tenants[0]._id
  } else {
    console.log('\nMore than one tenant (or none). Run again with: --tenant=<id from the list above>')
    return
  }
  console.log(`\nUsing tenant: ${tenantId}\n`)

  const customers = db.collection('customers')
  const sales = db.collection('sales')
  const payments = db.collection('payments')
  const missing = { tenantId: { $exists: false } }

  // 2. before
  console.log('BEFORE')
  console.log('  customers without tenantId:', await customers.countDocuments(missing))
  console.log('  sales without tenantId:    ', await sales.countDocuments(missing))
  console.log('  payments without tenantId: ', await payments.countDocuments(missing))

  if (!APPLY) {
    console.log('\nDry run finished. If the numbers look right, run again with --apply')
    return
  }

  // 3. customers first
  const c = await customers.updateMany(missing, { $set: { tenantId } })
  console.log(`\nCustomers updated: ${c.modifiedCount}`)

  // 4. sales and payments, matched through the customer's userId
  let salesUpdated = 0
  let paymentsUpdated = 0
  const cursor = customers.find({ tenantId, userId: { $nin: [null, ''] } }, { projection: { userId: 1, tenantId: 1 } })
  for await (const cust of cursor) {
    const s = await sales.updateMany({ customerId: cust.userId, ...missing }, { $set: { tenantId: cust.tenantId } })
    const p = await payments.updateMany({ customerId: cust.userId, ...missing }, { $set: { tenantId: cust.tenantId } })
    salesUpdated += s.modifiedCount
    paymentsUpdated += p.modifiedCount
  }
  console.log(`Sales updated: ${salesUpdated}`)
  console.log(`Payments updated: ${paymentsUpdated}`)

  // 5. after
  console.log('\nAFTER')
  console.log('  customers without tenantId:', await customers.countDocuments(missing))
  console.log('  sales without tenantId:    ', await sales.countDocuments(missing))
  console.log('  payments without tenantId: ', await payments.countDocuments(missing))
}

main()
  .catch((err) => console.error('Failed:', err.message))
  .finally(() => mongoose.disconnect())