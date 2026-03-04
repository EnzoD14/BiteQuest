const express = require('express');
const router = express.Router();
const { getProfile, createOrUpdateProfile } = require('../controllers/profileController');
const { protect } = require('../middlewares/auth');

router.route('/')
    .get(protect, getProfile)
    .post(protect, createOrUpdateProfile)
    .put(protect, createOrUpdateProfile);

module.exports = router;
