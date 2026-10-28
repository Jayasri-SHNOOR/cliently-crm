require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/db')
const { initFirebaseAdmin } = require('./config/firebaseAdmin')

const PORT = process.env.PORT || 5000

async function start() {
  initFirebaseAdmin()
  await connectDB()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err.message)
  process.exit(1)
})