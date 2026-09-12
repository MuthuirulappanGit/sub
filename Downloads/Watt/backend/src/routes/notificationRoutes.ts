import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { getNotifications } from '../controllers/notificationController.js';

const router = Router();
router.get('/notifications', authenticate, getNotifications);
export default router;
