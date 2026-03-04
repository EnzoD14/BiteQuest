const mongoose = require('mongoose');

// Profile Schema - Datos Médicos aislados y anonimizables
const profileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Datos Físicos (En producción estricta Ley 25.326 podrían ir encriptados a nivel DB)
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true },
    weight: { type: Number, required: true }, // kg
    height: { type: Number, required: true }, // cm

    // Metas y Restricciones
    dietaryRestriction: {
        type: String,
        enum: ['none', 'vegetarian', 'vegan', 'celiac', 'other'],
        default: 'none'
    },
    goal: {
        type: String,
        enum: ['lose_weight', 'maintain', 'gain_muscle'],
        required: true
    },
    activityLevel: {
        type: Number,
        enum: [1.2, 1.375, 1.55, 1.725, 1.9],
        default: 1.2
    },

    // Gamificación (SDT / Fogg)
    level: { type: Number, default: 1 },
    points: { type: Number, default: 0 },

    // Target calculado por el Motor de Reglas local (TMB Harris-Benedict)
    dailyCaloricTarget: { type: Number, required: true, default: 2000 }
}, {
    timestamps: true
});

module.exports = mongoose.model('Profile', profileSchema);
