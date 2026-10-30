const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
require('dotenv').config();

const requireAuth = require('./middleware/auth');
const { ipShield, userLimiter } = require('./middleware/limiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./modules/auth/routes/authRoutes');
const clientAdminRoutes = require('./modules/client-admin');
const superAdminRoutes = require('./modules/super-admin/index.js');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL || true,
  exposedHeaders: [
    'Retry-After',
    'RateLimit-Limit',
    'RateLimit-Remaining'
  ]
}));

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1
      ? 'connected'
      : 'disconnected',
    dbName: mongoose.connection.name,
    time: new Date().toISOString()
  });
});

app.use('/api', ipShield);
app.use('/api/auth', authRoutes);

// 1. requireAuth must run first: it sets req.user
app.use('/api', requireAuth);
// 2. userLimiter needs req.user.tenantId, so it comes after
app.use('/api', userLimiter);

// Existing Client Admin routes - preserved
app.use('/api', clientAdminRoutes);

// Super Admin routes
app.use('/api/super-admin', superAdminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
