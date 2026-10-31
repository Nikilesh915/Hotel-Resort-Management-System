import { Router } from 'express';
import {
  getCoupons,
  createCoupon,
  updateCoupon,
  updateCouponStatus,
  deleteCoupon,
  handleValidateCoupon,
  getCouponRedemptions
} from '../controllers/couponController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.post('/validate', handleValidateCoupon);
router.get('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), getCoupons);
router.post('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createCoupon);
router.put('/:id', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateCoupon);
router.put('/:id/status', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateCouponStatus);
router.delete('/:id', authMiddleware, requireRoles('ADMIN'), deleteCoupon);
router.get('/redemptions', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), getCouponRedemptions);

export default router;

