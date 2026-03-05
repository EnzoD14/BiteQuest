const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Rutas
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const foodRoutes = require('./routes/foodRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const telemetryRoutes = require('./routes/telemetryRoutes');
const logRoutes = require('./routes/logRoutes');

const app = express();

// Mejora #3: CORS restringido a orígenes del frontend
const allowedOrigins = [
    'http://localhost:8081',  // Expo Web dev
    'http://localhost:19006', // Expo Web alternativo
    'http://127.0.0.1:8081',
];
app.use(cors({
    origin: (origin, callback) => {
        // Permitir peticiones sin origin (ej. React Native Android/iOS nativo)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origen no permitido → ${origin}`));
        }
    },
    credentials: true
}));

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Base Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', foodRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/logs', logRoutes);

// Error Handler generico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

module.exports = app;
