const mongoose = require('mongoose');

const experimentTelemetrySchema = new mongoose.Schema({
  anonymousUserId: {
    type: String,
    required: true,
    index: true
  },
  event: {
    type: String,
    required: true,
    enum: ['SESSION_START', 'FOOD_LOG', 'CHALLENGE_COMPLETE', 'PROFILE_UPDATE']
  },
  sessionDurationMs: {
    type: Number,
    default: 0
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ExperimentTelemetry', experimentTelemetrySchema);
