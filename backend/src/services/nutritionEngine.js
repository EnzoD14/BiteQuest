/**
 * Motor de Recomendaciones (Basado puramente en Reglas, No-IA)
 * Ecuación de Harris-Benedict (Revisada por Mifflin-St Jeor)
 */

const calculateBasalMetabolicRate = (weight, height, age, gender) => {
    // Fórmula Mifflin-St Jeor (Kg, Cm, Años)
    if (gender === 'male') {
        return (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'female') {
        return (10 * weight) + (6.25 * height) - (5 * age) - 161;
    }
    // En caso 'other', asumimos promedio entre ambas
    return (10 * weight) + (6.25 * height) - (5 * age) - 78;
};

const calculateDailyTarget = (tmb, goal, activityLevel = 1.2) => {
    // Multiplicador de actividad física (1.2 sedentario, 1.375 poco, 1.55 medio, 1.725 alto, 1.9 muy alto)
    const maintenanceCalories = tmb * activityLevel;

    // Déficit/Superávit basado en reglas estrictas (-500 cal para perder, +300 para ganar)
    switch (goal) {
        case 'lose_weight':
            return Math.round(maintenanceCalories - 500);
        case 'gain_muscle':
            return Math.round(maintenanceCalories + 300);
        case 'maintain':
        default:
            return Math.round(maintenanceCalories);
    }
};

// Arch #8: Lógica de nivel centralizada — evita duplicación en challengeController y dashboardController
// Cada 500 puntos sube 1 nivel (Gamificación SDT)
const calculateLevel = (points) => Math.floor(points / 500) + 1;

module.exports = {
    calculateBasalMetabolicRate,
    calculateDailyTarget,
    calculateLevel
};
