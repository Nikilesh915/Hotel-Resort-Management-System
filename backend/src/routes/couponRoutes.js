import { Router } from 'express';
import { getCoupons, createCoupon, updateCouponStatus, handleValidateCoupon } from '../controllers/couponController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.post('/validate', handleValidateCoupon);
router.get('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), getCoupons);
router.post('/', authMiddleware, requireRoles('ADMIN'), createCoupon);
router.put('/:id/status', authMiddleware, requireRoles('ADMIN'), updateCouponStatus);

export default router;
