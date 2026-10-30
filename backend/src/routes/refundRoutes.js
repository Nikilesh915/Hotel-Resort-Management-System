import { Router } from 'express';
import { getRefundById, getAllRefunds } from '../controllers/refundController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.get('/all', requireRoles('ADMIN', 'PROPERTY_MANAGER'), getAllRefunds);
router.get('/:id', getRefundById);

export default router;

