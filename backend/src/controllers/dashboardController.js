const Profile = require('../models/Profile');
const FoodLog = require('../models/FoodLog');
const { calculateLevel } = require('../services/nutritionEngine'); // Arch #8

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

        // Targets de macros calculados según peso y objetivo del usuario
        // Proteína: 1.6 g/kg para ganar músculo, 1.2 g/kg para mantener/bajar
        const proteinMultiplier = profile.goal === 'gain_muscle' ? 1.6 : 1.2;
        const proteinTarget = Math.round(profile.weight * proteinMultiplier);
        // Carbos y grasas distribuidos del resto de calorías
        const proteinCalories = proteinTarget * 4;
        const remainingCalories = profile.dailyCaloricTarget - proteinCalories;
        const carbsTarget = Math.round((remainingCalories * 0.55) / 4); // 55% restante en carbos
        const fatsTarget = Math.round((remainingCalories * 0.45) / 9);  // 45% restante en grasas

        res.json({
            targetCalories: profile.dailyCaloricTarget,
            caloriesConsumed,
            proteinConsumed,
            carbsConsumed,
            fatsConsumed,
            adherenceDeviation,
            proteinTarget,
            carbsTarget,
            fatsTarget,
            level: calculateLevel(profile.points), // Arch #8: usa la función centralizada
            points: profile.points,
            pointsToNextLevel: 500 - (profile.points % 500),
            recentLogs: logs
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando dashboard' });
    }
};

// @desc    Obtener historial de los últimos 7 días agrupado por día
// @route   GET /api/dashboard/weekly
// @access  Private
const getWeeklyData = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Perfil incompleto' });
        }

        // Armar rango: desde hace 6 días a las 00:00 hasta ahora
        const startOf7DaysAgo = new Date();
        startOf7DaysAgo.setDate(startOf7DaysAgo.getDate() - 6);
        startOf7DaysAgo.setHours(0, 0, 0, 0);

        const logs = await FoodLog.find({
            userId: req.user.id,
            date: { $gte: startOf7DaysAgo }
        });

        // Inicializar los 7 días con ceros
        const daysMap = {};
        const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().split('T')[0];
            daysMap[key] = {
                date: key,
                label: i === 0 ? 'Hoy' : DAYS_ES[d.getDay()],
                calories: 0,
                protein: 0,
                carbs: 0,
                fats: 0,
            };
        }

        // Acumular logs en el día correspondiente
        for (const log of logs) {
            const key = new Date(log.date).toISOString().split('T')[0];
            if (daysMap[key]) {
                daysMap[key].calories += log.calories || 0;
                daysMap[key].protein += log.protein || 0;
                daysMap[key].carbs += log.carbs || 0;
                daysMap[key].fats += log.fats || 0;
            }
        }

        // Targets de macros (misma lógica que getDashboardData)
        const proteinMultiplier = profile.goal === 'gain_muscle' ? 1.6 : 1.2;
        const proteinTarget = Math.round(profile.weight * proteinMultiplier);
        const proteinCalories = proteinTarget * 4;
        const remainingCalories = profile.dailyCaloricTarget - proteinCalories;
        const carbsTarget = Math.round((remainingCalories * 0.55) / 4);
        const fatsTarget = Math.round((remainingCalories * 0.45) / 9);

        res.json({
            days: Object.values(daysMap),
            targetCalories: profile.dailyCaloricTarget,
            proteinTarget,
            carbsTarget,
            fatsTarget,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando historial semanal' });
    }
};

module.exports = {
    getDashboardData,
    getWeeklyData
};
