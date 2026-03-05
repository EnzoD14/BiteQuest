const express = require('express');
const router = express.Router();
const { getDashboardData, getWeeklyData } = require('../controllers/dashboardController');
const { protect } = require('../middlewares/auth');

router.get('/', protect, getDashboardData);
router.get('/weekly', protect, getWeeklyData);

module.exports = router;
