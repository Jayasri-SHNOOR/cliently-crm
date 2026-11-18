require('dotenv').config()
const mongoose = require('mongoose')
const Lead = require('../models/Lead')
const Product = require('../models/Product')

async function main() {
  await mongoose.connect(process.env.MONGO_URI)

  const leads = await Lead.find({}).select('tenantId productId productName productInterested').lean()
  let fixed = 0

  for (const lead of leads) {
    let name = null
    let productId = lead.productId || null

    if (productId) {
      const product = await Product.findOne({ _id: productId, tenantId: lead.tenantId }).select('name').lean()
      name = product ? product.name : lead.productName || null
    } else if (lead.productInterested && lead.productInterested !== 'Other') {
      const product = await Product.findOne({ tenantId: lead.tenantId, name: lead.productInterested })
        .collation({ locale: 'en', strength: 2 })
        .select('name')
        .lean()
      if (product) {
        name = product.name
        productId = product._id
      }
    }

    if (name && (name !== lead.productInterested || String(productId) !== String(lead.productId))) {
      await Lead.updateOne({ _id: lead._id }, { $set: { productInterested: name, productName: name, productId } })
      fixed += 1
    }
  }

  console.log(`Checked ${leads.length} leads, fixed ${fixed}`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})