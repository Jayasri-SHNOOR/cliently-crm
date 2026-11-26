const mongoose = require('mongoose')
const Product = require('../../../models/Product')
const AppError = require('../../../utils/AppError')

const PROTECTED_FIELDS = ['_id', 'tenantId', 'createdAt', 'updatedAt', '__v']

function productData(body) {
  const data = { ...body }
  PROTECTED_FIELDS.forEach((field) => delete data[field])
  if (typeof data.code === 'string' && data.code.trim() === '') {
    delete data.code
  }
  return data
}

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400)
  }
}

exports.getProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 })
    res.status(200).json(products)
  } catch (error) {
    next(error)
  }
}

exports.createProduct = async (req, res, next) => {
  try {
    const product = await Product.create({
      ...productData(req.body),
      tenantId: req.user.tenantId
    })
    res.status(201).json(product)
  } catch (error) {
    next(error)
  }
}

exports.updateProduct = async (req, res, next) => {
  try {
    assertValidId(req.params.id)

    const update = { $set: productData(req.body) }
    if (req.body.code === '') {
      update.$unset = { code: 1 }
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      update,
      { returnDocument: 'after', runValidators: true }
    )

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    res.status(200).json(product)
  } catch (error) {
    next(error)
  }
}

exports.deleteProduct = async (req, res, next) => {
  try {
    assertValidId(req.params.id)

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })

    if (!product) {
      throw new AppError('Product not found', 404)
    }

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    next(error)
  }
}