const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { registerUser, loginUser, deleteAccount } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

// Mejora #11: Rate limiting — máximo 10 intentos por IP cada 15 minutos
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Demasiados intentos. Por favor esperá 15 minutos antes de reintentar.' }
});

router.post('/register', authLimiter, registerUser);
router.post('/login', authLimiter, loginUser);
router.delete('/account', protect, deleteAccount); // Mejora #4: Eliminar cuenta

module.exports = router;
