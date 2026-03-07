const Profile = require('../models/Profile');
const FoodLog = require('../models/FoodLog');
const { calculateLevel, calculateMacroTargets } = require('../services/nutritionEngine'); // Mejora #3

// @desc    Obtener estado consolidado del Dashboard
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

        // Limpieza de datos corruptos/sin macros
        const invalidLogs = logs.filter(log => typeof log.protein === 'undefined' || log.protein === null);
        if (invalidLogs.length > 0) {
            await FoodLog.deleteMany({ _id: { $in: invalidLogs.map(l => l._id) } });
            logs = logs.filter(log => typeof log.protein !== 'undefined' && log.protein !== null);
        }

        const caloriesConsumed = logs.reduce((acc, log) => acc + (log.calories || 0), 0);
        const proteinConsumed = logs.reduce((acc, log) => acc + (log.protein || 0), 0);
        const carbsConsumed = logs.reduce((acc, log) => acc + (log.carbs || 0), 0);
        const fatsConsumed = logs.reduce((acc, log) => acc + (log.fats || 0), 0);

        const adherenceDeviation = caloriesConsumed - profile.dailyCaloricTarget;

        // Mejora #3: lógica de macros centralizada
        const { proteinTarget, carbsTarget, fatsTarget } = calculateMacroTargets(profile);

        // Mejora v5 #3: Streak optimizado con aggregation pipeline (reemplaza N+1 queries)
        let streak = 0;
        if (logs.length > 0) {
            const streakResult = await FoodLog.aggregate([
                { $match: { userId: profile.userId } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }
                    }
                },
                { $sort: { _id: -1 } },
                { $limit: 366 }
            ]);

            const loggedDates = new Set(streakResult.map(r => r._id));
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            for (let i = 0; i <= 365; i++) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const key = d.toISOString().split('T')[0];
                if (loggedDates.has(key)) {
                    streak++;
                } else {
                    break;
                }
            }
        }

        // Mejora #12: Limitar recentLogs a los últimos 5 para no saturar el dashboard
        const totalLogsToday = logs.length;
        const recentLogs = logs.slice(-5);

        res.json({
            targetCalories: profile.dailyCaloricTarget,
            caloriesConsumed,
            proteinConsumed, carbsConsumed, fatsConsumed,
            adherenceDeviation,
            proteinTarget, carbsTarget, fatsTarget,
            level: calculateLevel(profile.points),
            points: profile.points,
            pointsToNextLevel: 500 - (profile.points % 500),
            streak,           // Mejora #4: racha real
            totalLogsToday,   // Mejora #12: total del día para el "Ver todos"
            recentLogs        // Solo últimos 5
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando dashboard' });
    }
};

// @desc    Obtener historial de los últimos 7 días (o rango con from/to)
// @route   GET /api/dashboard/weekly?from=YYYY-MM-DD&to=YYYY-MM-DD
// @access  Private
const getWeeklyData = async (req, res) => {
    try {
        const profile = await Profile.findOne({ userId: req.user.id });
        if (!profile) {
            return res.status(404).json({ message: 'Perfil incompleto' });
        }

        // Mejora #7: Soporte de rango de fechas opcional via query params
        let startDate, endDate;
        if (req.query.from && req.query.to) {
            startDate = new Date(req.query.from);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(req.query.to);
            endDate.setHours(23, 59, 59, 999);
        } else {
            // Default: últimos 7 días
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 6);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date();
            endDate.setHours(23, 59, 59, 999);
        }

        const logs = await FoodLog.find({
            userId: req.user.id,
            date: { $gte: startDate, $lte: endDate }
        });

        // Construir mapa de días en el rango
        const daysMap = {};
        const DAYS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            d.setHours(0, 0, 0, 0);
            const key = d.toISOString().split('T')[0];
            const isToday = d.getTime() === today.getTime();
            daysMap[key] = {
                date: key,
                label: isToday ? 'Hoy' : DAYS_ES[d.getDay()],
                calories: 0, protein: 0, carbs: 0, fats: 0,
            };
        }

        for (const log of logs) {
            const key = new Date(log.date).toISOString().split('T')[0];
            if (daysMap[key]) {
                daysMap[key].calories += log.calories || 0;
                daysMap[key].protein += log.protein || 0;
                daysMap[key].carbs += log.carbs || 0;
                daysMap[key].fats += log.fats || 0;
            }
        }

        // Mejora #3: macro targets centralizados
        const { proteinTarget, carbsTarget, fatsTarget } = calculateMacroTargets(profile);

        res.json({
            days: Object.values(daysMap),
            targetCalories: profile.dailyCaloricTarget,
            proteinTarget, carbsTarget, fatsTarget,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando historial semanal' });
    }
};

module.exports = { getDashboardData, getWeeklyData };

