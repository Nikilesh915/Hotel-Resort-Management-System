import { Router } from 'express';
import { getProperties, getPropertyById, createProperty, updateProperty } from '../controllers/propertyController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.get('/', optionalAuthMiddleware, getProperties);
router.get('/:id', optionalAuthMiddleware, getPropertyById);
router.post('/', authMiddleware, requireRoles('ADMIN'), createProperty);
router.put('/:id', authMiddleware, requireRoles('ADMIN', 'PROPERTY_MANAGER'), updateProperty);

export default router;

