const Profile = require('../models/Profile');
const { calculateBasalMetabolicRate, calculateDailyTarget } = require('../services/nutritionEngine');

// @desc    Obtener perfil de usuario
// @route   GET /api/profile
// @access  Private
const getProfile = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Perfil no encontrado' });
        }
        res.json(profile);
    } catch (error) {
        console.error("Error obteniendo perfil: ", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Crear / Configurar Perfil y Correr Motor de Reglas
// @route   POST /api/profile
// @access  Private
const createOrUpdateProfile = async (req, res) => {
    try {
        const { age, gender, weight, height, dietaryRestriction, goal, activityLevel = 1.2 } = req.body;

        // 1. Correr el Motor (Reglas, No-IA)
        const tmb = calculateBasalMetabolicRate(weight, height, age, gender);
        const dailyCaloricTarget = calculateDailyTarget(tmb, goal, activityLevel);

        let profile = await Profile.findOne({ userId: req.user.id });

        if (profile) {
            // Update
            profile.age = age;
            profile.gender = gender;
            profile.weight = weight;
            profile.height = height;
            profile.dietaryRestriction = dietaryRestriction;
            profile.goal = goal;
            profile.activityLevel = activityLevel;
            profile.dailyCaloricTarget = dailyCaloricTarget;
            await profile.save();
        } else {
            // Create
            profile = await Profile.create({
                userId: req.user.id,
                age, gender, weight, height, dietaryRestriction, goal, activityLevel,
                dailyCaloricTarget
            });
        }

        res.json(profile);
    } catch (error) {
        console.error("Error guardando perfil: ", error);
        res.status(500).json({ message: 'Error del servidor validando datos médicos' });
    }
};

module.exports = {
    getProfile,
    createOrUpdateProfile
};
