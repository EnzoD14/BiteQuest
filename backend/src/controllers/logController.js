const FoodLog = require('../models/FoodLog');

// @desc    Obtener todos los logs del usuario (con filtro de fecha opcional)
// @route   GET /api/logs?date=YYYY-MM-DD
// @access  Private
const getLogs = async (req, res) => {
    try {
        const { date } = req.query;
        let filter = { userId: req.user.id };

        if (date) {
            // Filtrar por día específico
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.date = { $gte: start, $lte: end };
        }

        const logs = await FoodLog.find(filter).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error cargando historial' });
    }
};

// @desc    Eliminar un log por ID (corrección de registros incorrectos)
// @route   DELETE /api/logs/:id
// @access  Private
const deleteLog = async (req, res) => {
    try {
        const log = await FoodLog.findById(req.params.id);
        if (!log) {
            return res.status(404).json({ message: 'Registro no encontrado' });
        }
        // Verificar que el log pertenece al usuario autenticado
        if (log.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'No autorizado' });
        }
        await log.deleteOne();
        res.json({ message: 'Registro eliminado correctamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error eliminando registro' });
    }
};

module.exports = { getLogs, deleteLog };
