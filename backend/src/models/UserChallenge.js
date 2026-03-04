const mongoose = require('mongoose');

// Progreso de retos de usuarios (Métrica: Tasa Retos Completados)
const userChallengeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    challengeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Challenge',
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    progressValue: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('UserChallenge', userChallengeSchema);
