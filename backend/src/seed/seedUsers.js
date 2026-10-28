require('dotenv').config()
const crypto = require('crypto')
const mongoose = require('mongoose')
const connectDB = require('../config/db')
const {initFirebaseAdmin} = require('../config/firebaseAdmin')
const Tenant = require('../models/Tenant')
const User = require('../models/User')

const accounts = [
  {
    name: 'NexaSoft Owner',
    email: process.env.SEED_SUPER_ADMIN_EMAIL || 'owner@nexasoft.com',
    role: 'SUPER_ADMIN',
    companySlug: null
  },
  {
    name: 'Jeyka',
    email: process.env.SEED_CLIENT_ADMIN_EMAIL || 'jeyka@cliently.com',
    role: 'CLIENT_ADMIN',
    companySlug: 'cliently'
  },
  {
    name: 'Arjun',
    email: process.env.SEED_SALES_USER_EMAIL || 'arjun@cliently.com',
    role: 'SALES_USER',
    companySlug: 'cliently'
  }
]

function randomPassword(){
  return crypto.randomBytes(24).toString('base64url')
}

async function findTenantId(slug){
  if(!slug) return undefined
  const tenant = await Tenant.findOne({slug}).lean()
  if(!tenant){
    throw new Error(`Company "${slug}" not found in tenants. Run the client admin seed first.`)
  }
  return tenant._id
}

async function findEmployeeId(tenantId, email){
  if(!tenantId) return undefined
  const employee = await mongoose.connection
    .collection('employees')
    .findOne({tenantId, email}, {projection:{ _id: 1 }})
  return employee ? employee._id : undefined
}

async function upsertFirebaseUser(auth, account){
  try{
    const existing = await auth.getUserByEmail(account.email)
    await auth.updateUser(existing.uid, {displayName: account.name})
    return { uid: existing.uid, firebase: 'exists (password unchanged)' }
  }catch(err){
    if (err.code !== 'auth/user-not-found') throw err
    const created = await auth.createUser({
      email: account.email,
      password: randomPassword(),
      displayName: account.name
    })
    return {uid: created.uid, firebase: 'created (use Forgot password)'}
  }
}

async function upsertMongoUser(account, uid, tenantId, employeeId) {
  let user = await User.findOne({email: account.email})
  if(!user){
    user = new User({email: account.email})
  }
  user.set({
    firebaseUid: uid,
    name: account.name,
    role: account.role,
    tenantId,
    employeeId
  })
  await user.save()
  return user
}

async function seedUsers(){
  const auth = initFirebaseAdmin()
  await connectDB()
  await User.init()

  const summary = []

  for (const account of accounts){
    const tenantId = await findTenantId(account.companySlug)
    const employeeId = await findEmployeeId(tenantId, account.email)
    const {uid, firebase} = await upsertFirebaseUser(auth, account)
    const user = await upsertMongoUser(account, uid, tenantId, employeeId)

    summary.push({
      email: user.email,
      role: user.role,
      company: account.companySlug || '-',
      firebase
    })
  }

  console.table(summary)
}

seedUsers()
  .catch((err) => {
    console.error('User seed failed:', err.message)
    process.exitCode = 1
  })
  .finally(() => mongoose.disconnect())