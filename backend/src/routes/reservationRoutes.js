import { Router } from 'express';
import {
  handleCreateReservation,
  getMyReservations,
  getReservationById,
  getAllReservations,
  handleUpdateStatus,
  handleCancelReservation
} from '../controllers/reservationController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.post('/', handleCreateReservation);
router.get('/my', getMyReservations);
router.get('/all', requireRoles('ADMIN', 'PROPERTY_MANAGER'), getAllReservations);
router.get('/:id', getReservationById);
router.put('/:id/status', requireRoles('ADMIN', 'PROPERTY_MANAGER'), handleUpdateStatus);
router.post('/:id/cancel', handleCancelReservation);

export default router;

