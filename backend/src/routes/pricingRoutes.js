import { Router } from 'express';
import {
  getAllPricingRules,
  createPricingRule,
  updatePricingRule,
  deletePricingRule
} from '../controllers/pricingController.js';
import { getPricingQuote } from '../controllers/searchController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

// Public / Guest pricing quote calculation
router.post('/quote', optionalAuthMiddleware, getPricingQuote);

// Admin / Property Manager pricing rules configuration
router.get('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), getAllPricingRules);
router.post('/', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), createPricingRule);
router.put('/:id', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updatePricingRule);
router.delete('/:id', authMiddleware, requireRoles('ADMIN'), deletePricingRule);

export default router;
