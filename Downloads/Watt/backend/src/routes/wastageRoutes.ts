import { Router } from 'express';
import { getWastageAlerts, getWastageStats, acknowledgeAlert, resolveAlert } from '../controllers/wastageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/wastage/alerts', authenticate, getWastageAlerts);
router.get('/wastage/stats', authenticate, getWastageStats);
router.patch('/wastage/alerts/:id/acknowledge', authenticate, acknowledgeAlert);
router.patch('/wastage/alerts/:id/resolve', authenticate, resolveAlert);

export default router;
