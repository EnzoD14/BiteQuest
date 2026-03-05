const mongoose = require('mongoose');

// Catálogo Inmutable Mock (FBM: Facilita registro/Ability)
const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    calories: { type: Number, required: true }, // por porción base
    protein: { type: Number, required: true, default: 0 },
    carbs: { type: Number, required: true, default: 0 },
    fats: { type: Number, required: true, default: 0 },
    category: { type: String, required: true, index: true }, // Quick Win 23: índice para acelerar filtros
    allergens: [{ type: String }] // ej. 'gluten', 'meat', 'dairy'
});

module.exports = mongoose.model('Food', foodSchema);
