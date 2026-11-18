const mongoose = require('mongoose')
const Product = require('../models/Product')
const AppError = require('./AppError')

const GENERAL_ENQUIRY = 'General enquiry'

function clean(value) {
  return typeof value === 'string' ? value.trim() : ''
}

async function resolveLeadProduct(body, tenantId) {
  const hasId = body.productId !== undefined
  const hasName = body.productInterested !== undefined
  if (!hasId && !hasName) {
    return null
  }

  const id = hasId && body.productId !== null ? clean(String(body.productId)) : ''
  const name = hasName ? clean(body.productInterested) : ''

  if (!id && (!name || name.toLowerCase() === GENERAL_ENQUIRY.toLowerCase())) {
    return { productId: null, productName: null, productInterested: GENERAL_ENQUIRY }
  }

  let product = null
  if (id) {
    if (!mongoose.isValidObjectId(id)) {
      throw new AppError('Select a valid product', 400)
    }
    product = await Product.findOne({ _id: id, tenantId }).select('name').lean()
  } else {
    product = await Product.findOne({ tenantId, name })
      .collation({ locale: 'en', strength: 2 })
      .select('name')
      .lean()
  }

  if (!product) {
    throw new AppError('Product not found in your products list', 400)
  }

  return { productId: product._id, productName: product.name, productInterested: product.name }
}

module.exports = resolveLeadProduct
module.exports.GENERAL_ENQUIRY = GENERAL_ENQUIRY