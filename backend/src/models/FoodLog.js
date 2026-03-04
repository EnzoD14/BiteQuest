const mongoose = require('mongoose');

// Registro de consumo (Para métrica Adherencia Nutricional)
const foodLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food',
        required: false // Permitimos registro manual libre
    },
    name: { type: String, required: true }, // Nombre copiando mock, o libre
    calories: { type: Number, required: true },
    protein: { type: Number, required: true, default: 0 },
    carbs: { type: Number, required: true, default: 0 },
    fats: { type: Number, required: true, default: 0 },
    date: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('FoodLog', foodLogSchema);
