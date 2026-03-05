const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_for_dev');

            // Colocamos el id en el request para uso posterior
            req.user = { id: decoded.id, anonymousId: decoded.anonymousId };
            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'No autorizado, token fallido' });
        }
    } else {
        return res.status(401).json({ message: 'No autorizado, sin token' });
    }
};

module.exports = { protect };
