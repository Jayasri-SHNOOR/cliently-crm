const mongoose = require('mongoose')
const Employee = require('../../../models/Employee')
const { assertSeatAvailable } = require('../../../utils/seats')

const getEmployees = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId
    const employees = await Employee.find({tenantId})
      .sort({createdAt: -1})

    res.status(200).json({
      count: withStats.length,
      employees: withStats
    })
  }catch(error){
    next(error)
  }
}
const getEmployeeById = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId
    const { id } = req.params

    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message: 'Invalid employee ID'
      })
    }

    const employee = await Employee.findOne({
      _id: id,
      tenantId
    }).lean()

    if(!employee){
      return res.status(404).json({
        message: 'Employee not found'
      })
    }

    res.status(200).json(employee)
  } catch(error){
    next(error)
  }
}


const createEmployee = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId
    const { name, email, role, department, phone, status } = req.body

    if(!name || !email){
      return res.status(400).json({
        message: 'Employee name and email are required'
      })
    }

    if (status === undefined || status === 'Active') {
      await assertSeatAvailable(tenantId)
    }

    const employee = await Employee.create({
      tenantId,
      name,
      email,
      role: 'Sales Executive', 
      department,
      phone,
      status
    })

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    })
  } catch (error) {
    next(error)
  }
}


const updateEmployee = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId
    const { id } = req.params

    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message: 'Invalid employee ID'
      })
    }

    const allowedFields = [
      'name',
      'email',
      'department',
      'phone',
      'status'
    ]

    const updates = {}

    for(const field of allowedFields){
      if (req.body[field] !== undefined){
        updates[field] = req.body[field]
      }
    }

    if(Object.keys(updates).length === 0){
      return res.status(400).json({
        message: 'Provide at least one field to update'
      })
    }

    if(updates.status === 'Active'){
      const current = await Employee.findOne({ _id: id, tenantId }).select('status').lean()

      if (!current) {
        return res.status(404).json({
          message: 'Employee not found'
        })
      }

      if (current.status !== 'Active') {
        await assertSeatAvailable(tenantId)
      }
    }

    const employee = await Employee.findOneAndUpdate(
      { _id: id, tenantId },
      { $set: updates },
      { new: true, runValidators: true }
    )

    if(!employee){
      return res.status(404).json({
        message: 'Employee not found'
      })
    }

    res.status(200).json({
      message: 'Employee updated successfully',
      employee
    })
  } catch (error) {
    next(error)
  }
}


const deleteEmployee = async (req, res, next) => {
  try{
    const tenantId = req.user.tenantId
    const { id } = req.params

    if(!mongoose.isValidObjectId(id)){
      return res.status(400).json({
        message: 'Invalid employee ID'
      })
    }

    const employee = await Employee.findOneAndDelete({
      _id: id,
      tenantId
    })

    if(!employee){
      return res.status(404).json({
        message: 'Employee not found'
      })
    }

    res.status(200).json({
      message: 'Employee deleted successfully'
    })
  }catch(error){
    next(error)
  }
}

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee
}