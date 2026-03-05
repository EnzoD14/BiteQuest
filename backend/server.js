require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bitequest';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB Connected (Ley 25.326 Ready)');
        app.listen(PORT, () => {
            const env = process.env.NODE_ENV || 'development';
            console.log(`✅ Server running → http://localhost:${PORT}  [${env.toUpperCase()}]`);
        });
    })
    .catch(err => {
        console.error('Database connection error:', err);
        process.exit(1);
    });
