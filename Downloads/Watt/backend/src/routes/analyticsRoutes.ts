import { Router } from 'express';
import { getAnalyticsSummary, getRecommendations, updateRecommendationStatus } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

router.get('/analytics/summary', authenticate, getAnalyticsSummary);
router.get('/analytics/recommendations', authenticate, getRecommendations);
router.patch('/analytics/recommendations/:id', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), updateRecommendationStatus);

export default router;
