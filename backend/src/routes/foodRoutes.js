const express = require('express');
const router = express.Router();
const { getRecommendedFoods, logFoodConsumption, getTodayLogs } = require('../controllers/foodController');
const { protect } = require('../middlewares/auth');

router.get('/foods', protect, getRecommendedFoods);
router.post('/logs', protect, logFoodConsumption);
router.get('/logs/today', protect, getTodayLogs);

module.exports = router;
