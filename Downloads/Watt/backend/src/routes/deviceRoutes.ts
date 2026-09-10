import { Router } from 'express';
import { getDevices, registerDevice, toggleRelay, registerDeviceSchema, toggleRelaySchema } from '../controllers/deviceController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/devices', authenticate, getDevices);
router.post('/devices', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), validateBody(registerDeviceSchema), registerDevice);
router.patch('/relays/:id/toggle', authenticate, validateBody(toggleRelaySchema), toggleRelay);

export default router;
