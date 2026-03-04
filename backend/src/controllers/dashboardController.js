const Profile = require('../models/Profile');
const FoodLog = require('../models/FoodLog');

// @desc    Obtener estado consolidado del Dashboard (Calorías, Nivel, Puntos actual)
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Perfil incompleto' });
        }

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        let logs = await FoodLog.find({
            userId: req.user.id,
            date: { $gte: startOfToday }
        });

        // Limpieza de datos corruptos/sin macros (por cambios de schema)
        const invalidLogs = logs.filter(log => typeof log.protein === 'undefined' || log.protein === null);
        if (invalidLogs.length > 0) {
            await FoodLog.deleteMany({ _id: { $in: invalidLogs.map(l => l._id) } });
            logs = logs.filter(log => typeof log.protein !== 'undefined' && log.protein !== null);
        }

        const caloriesConsumed = logs.reduce((acc, log) => acc + (log.calories || 0), 0);
        const proteinConsumed = logs.reduce((acc, log) => acc + (log.protein || 0), 0);
        const carbsConsumed = logs.reduce((acc, log) => acc + (log.carbs || 0), 0);
        const fatsConsumed = logs.reduce((acc, log) => acc + (log.fats || 0), 0);

        // Métrica calculada al vuelo
        const adherenceDeviation = caloriesConsumed - profile.dailyCaloricTarget;

        res.json({
            targetCalories: profile.dailyCaloricTarget,
            caloriesConsumed,
            proteinConsumed,
            carbsConsumed,
            fatsConsumed,
            adherenceDeviation,
            level: profile.level,
            points: profile.points,
            pointsToNextLevel: 500 - (profile.points % 500),
            recentLogs: logs // Mandamos todos los del dia
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando dashboard' });
    }
};

module.exports = {
    getDashboardData
};
