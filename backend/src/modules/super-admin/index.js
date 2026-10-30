
const express = require('express');
const router = express.Router();

const tenantRoutes = require('./routes/tenantRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const planRoutes = require('./routes/planRoutes');
const integrationRoutes = require('./routes/integrationRoutes');
const systemHealthRoutes = require('./routes/systemHealthRoutes');
const securityLogRoutes = require('./routes/securityLogRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const dashboardRoutes = require("./routes/dashboardRoutes");

router.use('/tenants', tenantRoutes);
router.use('/subscriptions', subscriptionRoutes);
router.use('/plans', planRoutes);
router.use('/integrations', integrationRoutes);
router.use('/system-health', systemHealthRoutes);
router.use('/security-logs', securityLogRoutes);
router.use('/notifications', notificationRoutes);
router.use('/announcements', announcementRoutes);
router.use("/dashboard", dashboardRoutes);
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Super Admin routes working'
  });
});

module.exports = router;
