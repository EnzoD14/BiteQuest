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

const app = express();

// Middlewares
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev')); // Logger para la defensa de métricas

// Base Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api', foodRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Error Handler generico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: err.message || 'Server Error' });
});

module.exports = app;
