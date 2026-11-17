const Employee = require('../../../models/Employee')
const Product = require('../../../models/Product')

async function getStaff(req, res, next){
  try{
    const staff = await Employee.find({tenantId: req.user.tenantId, status: 'Active'})
      .select('name email role')
      .sort({name: 1})
      .lean()
    res.json({data: staff})
  }catch(err){
    next(err)
  }
}

async function getProducts(req, res, next){
  try{
    const products = await Product.find({tenantId: req.user.tenantId, status: 'Active'})
      .select('name type')
      .sort({name: 1})
      .lean()
    res.json({ data: products})
  }catch(err){
    next(err)
  }
}

module.exports = { getStaff, getProducts }