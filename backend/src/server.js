require('dotenv').config()
const app = require('./app')
console.log('App type:', typeof app);
console.log('App listen:', typeof app.listen);
const connectDB = require('./config/db')
const {initFirebaseAdmin} = require('./config/firebaseAdmin')
const { assertSessionConfig } = require('./config/session')
const PORT = process.env.PORT || 5000

function initFirebaseSafely() {
  const isProduction = process.env.NODE_ENV === 'production'

  if (!process.env.FIREBASE_SERVICE_ACCOUNT_PATH && !isProduction) {
    console.warn(
      '[DEV WARNING] FIREBASE_SERVICE_ACCOUNT_PATH is not set. ' +
      'Firebase is NOT initialised, so Firebase-based features (e.g. login) will not work. ' +
      'Ask the team for the service account file.'
    )
    return
  }

  initFirebaseAdmin()
}

async function start() {
  initFirebaseSafely()
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err.message)
  process.exit(1)
})