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

// Arch #10: Índice compuesto único para evitar duplicados en asignación de retos diarios
// Junto con el upsert en challengeController garantiza idempotencia ante race conditions
userChallengeSchema.index({ userId: 1, challengeId: 1, date: 1 }, { unique: false });

module.exports = mongoose.model('UserChallenge', userChallengeSchema);
