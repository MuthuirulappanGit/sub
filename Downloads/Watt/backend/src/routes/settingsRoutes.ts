import { Router } from 'express';
import { getSettings, updateSettings, updateSettingsSchema } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();
router.get('/settings', authenticate, getSettings);
router.put('/settings', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), validateBody(updateSettingsSchema), updateSettings);
export default router;
