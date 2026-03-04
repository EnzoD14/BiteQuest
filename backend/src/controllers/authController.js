const User = require('../models/User');
const Profile = require('../models/Profile'); // Para verificar si ya tiene perfil
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Helpers
const generateToken = (id, anonymousId) => {
    return jwt.sign({ id, anonymousId }, process.env.JWT_SECRET || 'fallback_secret_for_dev', {
        expiresIn: '30d',
    });
};

// @desc    Registrar nuevo usuario (Separación de credenciales Ley 25.326)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // Hash dinámico de la contraseña
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // ID Anónimo opaco para métricas experimentales
        const anonymousId = crypto.randomBytes(16).toString('hex');

        const user = await User.create({
            email,
            passwordHash,
            anonymousId
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                email: user.email,
                anonymousId: user.anonymousId,
                token: generateToken(user._id, user.anonymousId),
            });
        } else {
            res.status(400).json({ message: 'Datos de usuario inválidos' });
        }
    } catch (error) {
        console.error("Error validando registro", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// @desc    Autenticar usuario y proveer token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            // Verificamos si ya llenó su perfil inicial
            const profile = await Profile.findOne({ userId: user._id });

            res.json({
                _id: user.id,
                email: user.email,
                anonymousId: user.anonymousId,
                hasProfile: !!profile,
                token: generateToken(user._id, user.anonymousId),
            });
        } else {
            res.status(401).json({ message: 'Email o contraseña inválidos' });
        }
    } catch (error) {
        console.error("Error en login", error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

module.exports = {
    registerUser,
    loginUser
};
