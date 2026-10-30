const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const requireSession = require('./middleware/requireSession')
const { ipShield, userLimiter } = require('./middleware/limiters')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./modules/auth/routes/authRoutes')
const clientAdminRoutes = require('./modules/client-admin')
const superAdminRoutes = require('./modules/super-admin')
const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials : true,
  exposedHeaders: ['Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining']
}))
app.use(express.json())
app.use(cookieParser())
app.use(morgan('dev'))


app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    time: new Date().toISOString()
  })
})
app.use('/api', ipShield)
app.use('/api/auth', authRoutes)
app.use('/api', requireSession)
app.use('/api', userLimiter)

app.use('/api', clientAdminRoutes)
app.use('/api/super-admin', superAdminRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
