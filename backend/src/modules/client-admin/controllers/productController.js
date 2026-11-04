const mongoose = require('mongoose')
const Product = require('../../../models/Product')

const PROTECTED_FIELDS = ['_id', 'tenantId', 'createdAt', 'updatedAt', '__v']

function productData(body) {
  const data = { ...body }
  PROTECTED_FIELDS.forEach((field) => delete data[field])
  return data
}

exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 })

    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createProduct = async (req, res) => {
  try {
    const product = await Product.create({
      ...productData(req.body),
      tenantId: req.user.tenantId
    })

    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' })
    }

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.user.tenantId },
      { $set: productData(req.body) },
      { new: true, runValidators: true }
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json(product)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: 'Invalid product ID' })
    }

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.user.tenantId
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}