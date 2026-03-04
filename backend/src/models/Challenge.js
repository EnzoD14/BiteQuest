const mongoose = require('mongoose');

// Catálogo de Retos (Teoría del Flujo)
const challengeSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    rewardPoints: { type: Number, required: true },
    difficultyLevel: { type: Number, default: 1 }, // Retos por nivel
    triggerType: { type: String, required: true } // Ej: 'water_1.5L', 'fruits_2'
});

module.exports = mongoose.model('Challenge', challengeSchema);
