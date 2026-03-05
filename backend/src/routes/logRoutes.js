const express = require('express');
const router = express.Router();
const { getLogs, deleteLog } = require('../controllers/logController');
const { protect } = require('../middlewares/auth');

// Mejora #11: Historial CRUD para el usuario autenticado
router.get('/', protect, getLogs);
router.delete('/:id', protect, deleteLog);

module.exports = router;
