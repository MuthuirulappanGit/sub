import { Router } from 'express';
import { ingestTelemetry, getLiveTelemetry, getTelemetryHistory, ingestTelemetrySchema } from '../controllers/telemetryController.js';
import { verifyEsp32Key, authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

// Ingest endpoint for ESP32 devices
router.post('/telemetry/ingest', verifyEsp32Key, validateBody(ingestTelemetrySchema), ingestTelemetry);
router.post('/telemetry', verifyEsp32Key, validateBody(ingestTelemetrySchema), ingestTelemetry);

// Live & Historical endpoints for dashboard
router.get('/telemetry/live', authenticate, getLiveTelemetry);
router.get('/telemetry/history', authenticate, getTelemetryHistory);

export default router;
