import { Router } from 'express';
import { login, logout, getProfile, loginSchema } from '../controllers/authController.js';
import { validateBody } from '../middleware/validate.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getProfile);

export default router;
