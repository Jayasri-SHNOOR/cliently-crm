require('dotenv').config()
const mongoose = require('mongoose')

const TARGETS = [
  { collection: 'leads', nameField: 'executive', idField: 'executiveId' },
  { collection: 'deals', nameField: 'assignedTo', idField: 'assignedToId' },
  { collection: 'quotations', nameField: 'executive', idField: 'executiveId' }
]

async function findEmployee(employees, tenantId, name) {
  const matches = await employees
    .find({ tenantId, name: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') })
    .project({ _id: 1, role: 1 })
    .toArray()
  if (matches.length <= 1) return { employee: matches[0] || null, reason: matches.length ? '' : 'no employee with this name' }
  const sales = matches.filter((m) => /^sales executive$/i.test(m.role || ''))
  if (sales.length === 1) return { employee: sales[0], reason: '' }
  return { employee: null, reason: `${matches.length} employees share this name` }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  const db = mongoose.connection
  const employees = db.collection('employees')
  const problems = []

  for (const t of TARGETS) {
    const groups = await db.collection(t.collection).aggregate([
      { $match: { [t.nameField]: { $nin: [null, ''] }, $or: [{ [t.idField]: { $exists: false } }, { [t.idField]: null }] } },
      { $group: { _id: { tenantId: '$tenantId', name: `$${t.nameField}` }, count: { $sum: 1 } } }
    ]).toArray()

    let linked = 0
    for (const g of groups) {
      const { employee, reason } = await findEmployee(employees, g._id.tenantId, g._id.name)
      if (!employee) {
        problems.push({ collection: t.collection, name: g._id.name, records: g.count, reason })
        continue
      }
      const result = await db.collection(t.collection).updateMany(
        {
          tenantId: g._id.tenantId,
          [t.nameField]: g._id.name,
          $or: [{ [t.idField]: { $exists: false } }, { [t.idField]: null }]
        },
        { $set: { [t.idField]: employee._id } }
      )
      linked += result.modifiedCount
    }
    console.log(`${t.collection}: ${linked} linked`)
  }

  if (problems.length) {
    console.log('Not linked (fix the name or the employee, then run again):')
    console.table(problems)
  }

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})