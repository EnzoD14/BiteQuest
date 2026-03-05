const Challenge = require('../models/Challenge');
const UserChallenge = require('../models/UserChallenge');
const Profile = require('../models/Profile');
const { calculateLevel } = require('../services/nutritionEngine'); // Arch #8

// @desc    Obtener retos o generarlos si no existen hoy (FBM - Prompts)
// @route   GET /api/challenges/daily
// @access  Private
const getDailyChallenges = async (req, res) => {
    try {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let userChallenges = await UserChallenge.find({
            userId: req.user.id,
            date: { $gte: startOfToday }
        }).populate('challengeId');

        // Limpieza de datos corruptos/huérfanos (por seeders)
        const orphaned = userChallenges.filter(uc => !uc.challengeId);
        if (orphaned.length > 0) {
            await UserChallenge.deleteMany({ _id: { $in: orphaned.map(o => o._id) } });
            userChallenges = userChallenges.filter(uc => uc.challengeId);
        }

        // Asignación de retos en base a Theory of Flow (dificultad progresiva por nivel)
        if (userChallenges.length === 0) {
            const profile = await Profile.findOne({ userId: req.user.id });
            const currentLevel = profile ? profile.level : 1;

            // Retos recomendados al nivel del usuario
            const challenges = await Challenge.find({ difficultyLevel: { $lte: currentLevel } }).limit(3);

            // Arch #10: Usamos findOneAndUpdate con upsert para evitar race conditions
            // Si dos peticiones llegan al mismo tiempo, sólo se crea un documento por reto
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            for (const challenge of challenges) {
                await UserChallenge.findOneAndUpdate(
                    { userId: req.user.id, challengeId: challenge._id, date: { $gte: today } },
                    { $setOnInsert: { userId: req.user.id, challengeId: challenge._id } },
                    { upsert: true, new: true }
                );
            }

            // Repopulate para mandar al cliente
            userChallenges = await UserChallenge.find({
                userId: req.user.id,
                date: { $gte: startOfToday }
            }).populate('challengeId');
        }

        res.json(userChallenges);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generando retos' });
    }
};

// @desc    Marcar un reto como completado (Suma de Puntos)
// @route   POST /api/challenges/:id/complete
// @access  Private
const completeChallenge = async (req, res) => {
    try {
        const userChallengeId = req.params.id;
        const userChallenge = await UserChallenge.findOne({ _id: userChallengeId, userId: req.user.id }).populate('challengeId');

        if (!userChallenge) {
            return res.status(404).json({ message: 'Reto no encontrado' });
        }

        if (userChallenge.isCompleted) {
            return res.status(400).json({ message: 'El reto ya fue completado' });
        }

        userChallenge.isCompleted = true;
        userChallenge.progressValue = 100; // Asumimos binario per MVP manual (agua 100%)
        await userChallenge.save();

        // Actualizar Puntos + Nivel en Perfil (Gamification SDT)
        const profile = await Profile.findOne({ userId: req.user.id });
        if (profile) {
            profile.points += userChallenge.challengeId.rewardPoints;

            // Arch #8: Lógica de nivel centralizada en nutritionEngine
            profile.level = calculateLevel(profile.points);

            await profile.save();
        }

        res.json({ message: 'Reto completado!', userChallenge, profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al completar reto' });
    }
};

module.exports = {
    getDailyChallenges,
    completeChallenge
};
