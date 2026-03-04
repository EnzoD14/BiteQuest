const Food = require('../models/Food');
const FoodLog = require('../models/FoodLog');
const Profile = require('../models/Profile');

// @desc    Obtener listado del catálogo mock basado en restriccion dietaria (FBM - Ability)
// @route   GET /api/foods
// @access  Private
const getRecommendedFoods = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        let query = {};

        // Filtros basados en reglas estáticas (Sin IA)
        if (profile && profile.dietaryRestriction) {
            if (profile.dietaryRestriction === 'vegan') {
                query.allergens = { $nin: ['meat', 'dairy', 'egg', 'animal_product'] };
            } else if (profile.dietaryRestriction === 'vegetarian') {
                query.allergens = { $nin: ['meat'] };
            } else if (profile.dietaryRestriction === 'celiac') {
                query.allergens = { $nin: ['gluten'] };
            }
        }

        const foods = await Food.find(query).limit(50);
        res.json(foods);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener alimentos' });
    }
};

// @desc    Pushear un log de comida consumida
// @route   POST /api/logs
// @access  Private
const logFoodConsumption = async (req, res) => {
    try {
        const { foodId, name, calories, protein, carbs, fats } = req.body;

        // Este evento es crucial para la métrica "Adherencia Nutricional" y "Frecuencia de Uso"
        const log = await FoodLog.create({
            userId: req.user.id,
            foodId,
            name,
            calories,
            protein: protein || 0,
            carbs: carbs || 0,
            fats: fats || 0
        });

        res.status(201).json(log);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error registrando consumo' });
    }
};

// @desc    Obtener logs de hoy (Progreso calórico)
// @route   GET /api/logs/today
// @access  Private
const getTodayLogs = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const logs = await FoodLog.find({
            userId: req.user.id,
            date: { $gte: startOfToday }
        });

        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error obteniendo progreso diario' });
    }
};

module.exports = {
    getRecommendedFoods,
    logFoodConsumption,
    getTodayLogs
};
