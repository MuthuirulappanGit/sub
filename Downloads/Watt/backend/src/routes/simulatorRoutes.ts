import { Router } from 'express';
import { getStatus, startSimulator, stopSimulator, triggerSpike, triggerSpikeSchema } from '../controllers/simulatorController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/simulator/status', authenticate, getStatus);
router.post('/simulator/start', authenticate, startSimulator);
router.post('/simulator/stop', authenticate, stopSimulator);
router.post('/simulator/trigger-spike', authenticate, validateBody(triggerSpikeSchema), triggerSpike);

export default router;
