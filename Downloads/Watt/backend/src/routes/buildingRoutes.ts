import { Router } from 'express';
import {
  getBuildings,
  getBuildingById,
  createBuilding,
  getRooms,
  createRoom,
  deleteRoom,
  createBuildingSchema,
  createRoomSchema,
} from '../controllers/buildingController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

const router = Router();

router.get('/buildings', authenticate, getBuildings);
router.get('/buildings/:id', authenticate, getBuildingById);
router.post('/buildings', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), validateBody(createBuildingSchema), createBuilding);

router.get('/rooms', authenticate, getRooms);
router.post('/rooms', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), validateBody(createRoomSchema), createRoom);
router.delete('/rooms/:id', authenticate, authorize('SUPER_ADMIN', 'FACILITY_MANAGER'), deleteRoom);

export default router;
