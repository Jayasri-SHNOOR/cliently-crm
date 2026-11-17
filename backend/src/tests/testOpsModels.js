const mongoose = require('mongoose')
const Ticket = require('../models/Ticket')
const WorkOrder = require('../models/WorkOrder')
const KbArticle = require('../models/KbArticle')
const Asset = require('../models/Asset')

const tenantId = new mongoose.Types.ObjectId()
let failures = 0

async function check(label, doc, expectValid) {
  let err = null
  try {
    await doc.validate()
  } catch (validationError) {
    err = validationError
  }
  const passed = expectValid ? !err : Boolean(err)
  if (!passed) {
    failures += 1
  }
  const detail = err && err.errors ? ` -> ${Object.keys(err.errors).join(', ')}` : ''
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${label}${detail}`)
}

async function main() {
  await check('valid ticket', new Ticket({
    tenantId, number: 1, subject: 'Printer offline', customer: { name: 'Ravi', company: 'ABC Corp' }
  }), true)

  await check('ticket without subject and with bad priority', new Ticket({
    tenantId, number: 2, priority: 'Panic', customer: { name: 'Ravi' }
  }), false)

  const workOrder = new WorkOrder({
    tenantId,
    number: 1,
    title: 'CRM rollout for ABC Corp',
    customer: { name: 'ABC Corp' },
    milestones: [
      { title: 'Install', done: true },
      { title: 'Train staff', done: true },
      { title: 'Go live', done: false }
    ]
  })
  await check('valid work order', workOrder, true)
  console.log(`      progress = ${workOrder.progress}% (expected 67%)`)

  await check('work order due before start', new WorkOrder({
    tenantId, number: 2, title: 'Late', customer: { name: 'X' },
    startDate: new Date('2026-12-10'), dueDate: new Date('2026-12-01')
  }), false)

  await check('valid knowledge base article', new KbArticle({
    tenantId, title: 'Reset a router', content: 'Hold the reset button for 10 seconds.', tags: ['WiFi', 'Router']
  }), true)

  await check('article with bad visibility', new KbArticle({
    tenantId, title: 'X', content: 'Y', visibility: 'Secret'
  }), false)

  const asset = new Asset({ tenantId, name: 'Dell Laptop', type: 'Hardware', quantity: 2, reorderLevel: 3 })
  await check('valid asset', asset, true)
  console.log(`      lowStock = ${asset.lowStock} (expected true)`)

  await check('asset with negative quantity', new Asset({
    tenantId, name: 'Cable', type: 'Consumable', quantity: -1
  }), false)

  console.log(failures === 0 ? '\nAll model checks passed.' : `\n${failures} check(s) failed.`)
}

main()