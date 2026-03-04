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

const challenges = [
    { title: 'Beber 1.5L de Agua', description: 'Mantente hidratado hoy.', rewardPoints: 50, difficultyLevel: 1, triggerType: 'water_1.5L' },
    { title: 'Día de 2 Frutas', description: 'Consume al menos 2 frutas.', rewardPoints: 100, difficultyLevel: 1, triggerType: 'fruits_2' },
    { title: 'Caminar 30 min', description: 'Ayuda a lograr déficit.', rewardPoints: 150, difficultyLevel: 2, triggerType: 'walk_30m' },
];

const importData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('DB Conectada');

        await Food.deleteMany();
        await Challenge.deleteMany();

        await Food.insertMany(foods);
        await Challenge.insertMany(challenges);

        console.log('Datos Mock importados. Listo para evaluación.');
        process.exit();
    } catch (error) {
        console.error('Error con seed: ', error);
        process.exit(1);
    }
};

importData();
