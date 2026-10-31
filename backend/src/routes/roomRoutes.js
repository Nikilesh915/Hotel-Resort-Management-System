import { Router } from 'express';
import {
  getRoomsByProperty,
  createRoom,
  updateRoom,
  updateRoomStatus,
  getRoomTypes,
  createRoomType,
  updateRoomType,
  getRoomAvailability,
  blockRoomDates,
  unblockRoomDates
} from '../controllers/roomController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// Room Types
router.get('/types', optionalAuthMiddleware, getRoomTypes);
router.post('/types', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createRoomType);
router.put('/types/:id', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateRoomType);

// Room Availability & Blocking
router.get('/:id/availability', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), getRoomAvailability);
router.post('/:id/block-dates', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), blockRoomDates);
router.post('/:id/unblock-dates', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), unblockRoomDates);

// Rooms
router.get('/property/:propertyId', optionalAuthMiddleware, getRoomsByProperty);
router.post('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createRoom);
router.put('/:id', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateRoom);
router.put('/:id/status', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateRoomStatus);

export default router;


