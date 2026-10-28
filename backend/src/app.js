const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')

const requireAuth = require('./middleware/auth')
const { ipShield, userLimiter } = require('./middleware/limiters')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./modules/auth/routes/authRoutes')
const clientAdminRoutes = require('./modules/client-admin')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  exposedHeaders: ['Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining']
}))
app.use(express.json())
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
app.use('/api', requireAuth)
app.use('/api', userLimiter)

app.use('/api', clientAdminRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app