const Product = require('../../../models/Product')
const Tenant = require('../../../models/Tenant')
async function getTenantId(req) {
  const tenant = await Tenant.findOne({ slug: 'cliently' })

  if (!tenant) {
    throw new Error('Tenant not found')
  }

  return tenant._id
}
exports.getProducts = async (req, res) => {
  try {
    const tenantId = await getTenantId(req)
    const products = await Product.find({ tenantId }).sort({ createdAt: -1 })

    res.status(200).json(products)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

exports.createProduct = async (req, res) => {
  try {
    const tenantId = await getTenantId(req)
    const product = await Product.create({
      ...req.body,
      tenantId
    })

    res.status(201).json(product)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updateProduct = async (req, res) => {
  try {
    const tenantId = await getTenantId(req)

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId },
      req.body,
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
    const tenantId = await getTenantId(req)

    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      tenantId
    })

    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json({ message: 'Product deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
