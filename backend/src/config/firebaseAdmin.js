const fs = require('fs')
const path = require('path')
const {initializeApp,cert,getApps} = require('firebase-admin/app')
const {getAuth} = require('firebase-admin/auth')

function loadServiceAccount() {
  const relativePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if(!relativePath){
    throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH is missing.')
  }
  const fullPath = path.resolve(process.cwd(), relativePath)
  if (!fs.existsSync(fullPath)){
    throw new Error(`Firebase service account file not found at ${fullPath}`)
  }
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

function initFirebaseAdmin() {
  if(getApps().length === 0){
    const serviceAccount = loadServiceAccount()
    initializeApp({ credential: cert(serviceAccount) })
    console.log(`Firebase Admin ready: project ${serviceAccount.project_id}`)
  }
  return getAuth()
}

function isFirebaseReady(){
  return getApps().length > 0
}

module.exports = {initFirebaseAdmin,isFirebaseReady}