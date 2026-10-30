import { Router } from 'express';
import {
  getRoomsByProperty,
  createRoom,
  updateRoomStatus,
  getRoomTypes,
  createRoomType
} from '../controllers/roomController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.get('/types', getRoomTypes);
router.post('/types', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createRoomType);
router.get('/property/:propertyId', getRoomsByProperty);
router.post('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createRoom);
router.put('/:id/status', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateRoomStatus);

export default router;

