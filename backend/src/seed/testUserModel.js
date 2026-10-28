const mongoose = require('mongoose')
const User = require('../models/User')

async function check(label, data){
  const user = new User(data)
  try{
    await user.validate()
    console.log(`PASS  ${label}`)
    return user
  }catch(err){
    const messages = Object.values(err.errors).map((e) => `${e.path}: ${e.message}`)
    console.log(`FAIL  ${label}\n      ${messages.join('\n      ')}`)
    return null
  }
}

async function main(){
  const companyId = new mongoose.Types.ObjectId()
  const admin = await check('Client admin with a company', {
    firebaseUid: 'uid-client-admin',
    email: '  Jeyka@Cliently.COM ',
    name: 'Jeyka',
    role: 'CLIENT_ADMIN',
    tenantId: companyId
  })
  if(admin) console.log(`      email saved as: ${admin.email}, status: ${admin.status}`)

  await check('Super admin without a company', {
    firebaseUid: 'uid-super-admin',
    email: 'owner@nexasoft.com',
    name: 'Platform Owner',
    role: 'SUPER_ADMIN'
  })

  await check('Sales user with a company', {
    firebaseUid: 'uid-sales',
    email: 'arjun@cliently.com',
    name: 'Arjun',
    role: 'SALES_USER',
    tenantId: companyId
  })
}

main()