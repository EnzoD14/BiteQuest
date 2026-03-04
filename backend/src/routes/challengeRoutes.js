const express = require('express');
const router = express.Router();
const { getDailyChallenges, completeChallenge } = require('../controllers/challengeController');
const { protect } = require('../middlewares/auth');

router.get('/daily', protect, getDailyChallenges);
router.post('/:id/complete', protect, completeChallenge);

module.exports = router;
