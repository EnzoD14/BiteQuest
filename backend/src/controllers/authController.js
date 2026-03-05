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
        const { email, password, name } = req.body; // Mejora #2: aceptar nombre

        // Quick Win 18: Validar formato de email y longitud de contraseña antes de consultar DB
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ message: 'El formato del email es inválido' });
        }
        if (!password || password.length < 6) {
            return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const anonymousId = crypto.randomBytes(16).toString('hex');

        const user = await User.create({
            email,
            name: name?.trim() || '',
            passwordHash,
            anonymousId
        });

        if (user) {
            res.status(201).json({
                _id: user.id,
                email: user.email,
                name: user.name,
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

        // Quick Win 18: Valida presencia antes de buscar en DB
        if (!email || !password) {
            return res.status(400).json({ message: 'Email y contraseña son requeridos' });
        }

        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            // Verificamos si ya llenó su perfil inicial
            const profile = await Profile.findOne({ userId: user._id });

            res.json({
                _id: user.id,
                email: user.email,
                name: user.name || '',
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
