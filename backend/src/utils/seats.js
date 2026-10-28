const Tenant = require('../models/Tenant')
const Employee = require('../models/Employee')
const AppError = require('./AppError')

async function getSeatUsage(tenantId) {
  const [tenant, used] = await Promise.all([
    Tenant.findById(tenantId).select('seats').lean(),
    Employee.countDocuments({ tenantId, status: 'Active' })
  ])
  if(!tenant){
    throw new AppError('Company not found', 404)
  }
  return{
    used,
    total: tenant.seats,
    available: Math.max(tenant.seats - used, 0)
  }
}

async function assertSeatAvailable(tenantId) {
  const seats = await getSeatUsage(tenantId)
  if(seats.available <= 0){
    throw new AppError(
      `All ${seats.total} seats are in use. Deactivate a user or upgrade your plan.`,
      409
    )
  }
  return seats
}

module.exports = {getSeatUsage,assertSeatAvailable}