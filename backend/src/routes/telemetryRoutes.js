const express = require('express');
const router = express.Router();
const { recordTelemetry } = require('../controllers/telemetryController');
const { protect } = require('../middlewares/auth');

router.post('/', protect, recordTelemetry);

module.exports = router;
