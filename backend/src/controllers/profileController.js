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

        // Quick Win 19: Validar campos obligatorios antes de llamar al motor
        if (!age || age < 10 || age > 120) {
            return res.status(400).json({ message: 'La edad debe estar entre 10 y 120 años' });
        }
        if (!['male', 'female', 'other'].includes(gender)) {
            return res.status(400).json({ message: 'Género inválido (male, female, other)' });
        }
        if (!weight || weight < 20 || weight > 300) {
            return res.status(400).json({ message: 'El peso debe estar entre 20 y 300 kg' });
        }
        if (!height || height < 100 || height > 250) {
            return res.status(400).json({ message: 'La altura debe estar entre 100 y 250 cm' });
        }
        if (!['lose_weight', 'maintain', 'gain_muscle'].includes(goal)) {
            return res.status(400).json({ message: 'Objetivo inválido' });
        }

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
