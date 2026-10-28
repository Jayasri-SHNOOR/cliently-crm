<<<<<<< HEAD
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
=======
const express = require('express')
const cors = require('cors')
const morgan = require('morgan')
const mongoose = require('mongoose')

const requireAuth = require('./middleware/auth')
const { ipShield, userLimiter } = require('./middleware/limiters')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const authRoutes = require('./modules/auth/routes/authRoutes')
const clientAdminRoutes = require('./modules/client-admin')
>>>>>>> dev

const app = express()

<<<<<<< HEAD
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());
=======
app.use(cors({
  origin: process.env.CLIENT_URL,
  exposedHeaders: ['Retry-After', 'RateLimit-Limit', 'RateLimit-Remaining']
}))
app.use(express.json())
app.use(morgan('dev'))
>>>>>>> dev

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    dbName: mongoose.connection.name,
    time: new Date().toISOString()
  })
})

<<<<<<< HEAD
// Module routes get mounted here in the next step

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CRM backend running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
=======
app.use('/api', ipShield)
app.use('/api/auth', authRoutes)
app.use('/api', requireAuth)
app.use('/api', userLimiter)

app.use('/api', clientAdminRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app
>>>>>>> dev
