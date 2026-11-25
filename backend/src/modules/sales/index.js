const express = require('express');
const requireRole = require('../../middleware/requireRole');

const salesExecutiveOnly = requireRole('SALES_EXECUTIVE');
const router = express.Router();

router.use('/dashboard', salesExecutiveOnly, require('./routes/dashboardRoutes'));
router.use('/leads', salesExecutiveOnly, require('./routes/leadRoutes'));
router.use('/customers', salesExecutiveOnly, require('./routes/customerRoutes'));
router.use('/tasks', salesExecutiveOnly, require('./routes/taskRoutes'));
router.use('/calendar', salesExecutiveOnly, require('./routes/activityRoutes'));
router.use('/notes', salesExecutiveOnly, require('./routes/noteRoutes'));
router.use('/products', salesExecutiveOnly, require('./routes/productRoutes'));
router.use('/notifications', salesExecutiveOnly, require('./routes/notificationRoutes'));
router.use('/profile', salesExecutiveOnly, require('./routes/profileRoutes'));

module.exports = router;