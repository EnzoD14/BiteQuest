const express = require('express');
const router = express.Router();
const { getDailyChallenges, completeChallenge } = require('../controllers/challengeController');
const { protect } = require('../middlewares/auth');

router.get('/daily', protect, getDailyChallenges);
router.patch('/:id/complete', protect, completeChallenge); // Mejora #8: PATCH en lugar de POST

module.exports = router;
