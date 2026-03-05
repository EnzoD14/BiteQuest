require('dotenv').config();
const mongoose = require('mongoose');
const Food = require('../src/models/Food');
const Challenge = require('../src/models/Challenge');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bitequest';

const comidasRaw = require('../../comidas.json');

const foods = comidasRaw.map(c => ({
    name: c.name,
    calories: c.calories,
    protein: c.protein_g,
    carbs: c.carbs_g,
    fats: c.fat_g,
    category: c.category,
    allergens: ['none']
}));

// Mejora #2: 15 challenges variados con dificultad progresiva
const challenges = [
    // Nivel 1 — Hidratación
    { title: 'Beber 1.5L de Agua', description: 'Mantenete hidratado hoy. El agua mejora el metabolismo y la concentración.', rewardPoints: 50, difficultyLevel: 1, triggerType: 'water_1.5L' },
    { title: 'Empezar el día con agua', description: 'Tomá un vaso de agua grande al levantarte antes de cualquier otra cosa.', rewardPoints: 30, difficultyLevel: 1, triggerType: 'water_morning' },
    // Nivel 1 — Nutrición
    { title: 'Día de 2 Frutas', description: 'Consume al menos 2 frutas enteras hoy. Vitaminas y fibra natural.', rewardPoints: 100, difficultyLevel: 1, triggerType: 'fruits_2' },
    { title: 'Desayuno con proteína', description: 'Incluí huevos, yogur griego o legumbres en tu desayuno de hoy.', rewardPoints: 80, difficultyLevel: 1, triggerType: 'protein_breakfast' },
    { title: 'Sin bebidas azucaradas', description: 'Pasá todo el día sin gaseosas, jugos industriales ni bebidas azucaradas.', rewardPoints: 100, difficultyLevel: 1, triggerType: 'no_sugar_drinks' },
    { title: 'Plato colorido', description: 'Comé un plato que tenga al menos 3 colores distintos de vegetales o frutas.', rewardPoints: 60, difficultyLevel: 1, triggerType: 'colorful_plate' },
    // Nivel 2 — Ejercicio
    { title: 'Caminar 30 min', description: 'Salí a caminar al menos 30 minutos. Ayuda a lograr déficit calórico y mejora el ánimo.', rewardPoints: 150, difficultyLevel: 2, triggerType: 'walk_30m' },
    { title: 'Caminar 10.000 pasos', description: 'Un objetivo clásico: 10.000 pasos activan el metabolismo y queman entre 300-500 kcal.', rewardPoints: 200, difficultyLevel: 2, triggerType: 'steps_10k' },
    { title: '20 minutos de ejercicio', description: 'Cualquier tipo: escaleras, bicicleta, yoga, gimnasio. Lo importante es moverse.', rewardPoints: 150, difficultyLevel: 2, triggerType: 'exercise_20m' },
    { title: 'Sin ascensor hoy', description: 'Usá las escaleras en lugar del ascensor en todos tus recorridos del día.', rewardPoints: 80, difficultyLevel: 2, triggerType: 'no_elevator' },
    // Nivel 2 — Hábitos
    { title: 'Comer sin pantallas', description: 'Realizá al menos una comida del día lejos de la pantalla del celular o TV.', rewardPoints: 100, difficultyLevel: 2, triggerType: 'no_screens_meal' },
    { title: 'Cocinar en casa', description: 'Preparate al menos una comida casera hoy en lugar de pedir delivery o comer afuera.', rewardPoints: 120, difficultyLevel: 2, triggerType: 'cook_at_home' },
    // Nivel 3 — Avanzado
    { title: 'Alcanzar meta calórica exacta', description: 'Terminá el día entre el 90% y el 110% de tu objetivo calórico personal.', rewardPoints: 300, difficultyLevel: 3, triggerType: 'caloric_target_hit' },
    { title: 'Semana activa (5 días)', description: 'Completaste 5 retos de ejercicio esta semana. Sos un ejemplo de consistencia.', rewardPoints: 400, difficultyLevel: 3, triggerType: 'weekly_exercise_5' },
    { title: 'Día completo sin ultraprocesados', description: 'Ninguna comida ultraprocesada hoy: sin snacks de paquete, comida rápida ni fideos instantáneos.', rewardPoints: 250, difficultyLevel: 3, triggerType: 'no_ultraprocessed' },
];

const importData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('DB Conectada');

        await Food.deleteMany();
        await Challenge.deleteMany();

        await Food.insertMany(foods);
        await Challenge.insertMany(challenges);

        console.log(`✅ Importados ${foods.length} alimentos y ${challenges.length} challenges.`);
        process.exit();
    } catch (error) {
        console.error('Error con seed: ', error);
        process.exit(1);
    }
};

importData();

