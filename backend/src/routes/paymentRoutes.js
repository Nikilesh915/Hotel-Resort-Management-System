import { Router } from 'express';
import { handlePayment, getPaymentById, getAllPayments } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.post('/', handlePayment);
router.get('/all', requireRoles('ADMIN', 'PROPERTY_MANAGER'), getAllPayments);
router.get('/:id', getPaymentById);

export default router;

