const ExperimentTelemetry = require('../models/ExperimentTelemetry');

// @desc    Guarda un evento pasivo en la base de datos (Ley 25.326, sin PII)
// @route   POST /api/telemetry
// @access  Private (Requiere token)
const recordTelemetry = async (req, res) => {
    try {
        const { event, sessionDurationMs, metadata } = req.body;

        // Obtenemos el anonymousId del req.user extraido por el middleware de JWT
        const { anonymousId } = req.user;

        const telemetry = await ExperimentTelemetry.create({
            anonymousUserId: anonymousId,
            event,
            sessionDurationMs,
            metadata
        });

        // Siempre devolvemos 200 para no bloquear flujo de UI, es un proceso ciego
        res.status(200).json({ success: true, telemetryId: telemetry._id });
    } catch (error) {
        console.error(`Error de Telemetría pasiva: ${error.message}`);
        // No devolvemos error 500 para no romper la app si falla el logger
        res.status(200).json({ success: false });
    }
};

module.exports = {
    recordTelemetry
};
