import { Router } from 'express';
import { getDashboardStats, getAuditLogs, getOperationalReports } from '../controllers/adminController.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRoles } from '../middleware/rbac.js';

const router = Router();

router.use(authMiddleware);

router.get('/dashboard/stats', requireRoles('ADMIN', 'PROPERTY_MANAGER'), getDashboardStats);
router.get('/reports', requireRoles('ADMIN', 'PROPERTY_MANAGER'), getOperationalReports);
router.get('/audit-logs', requireRoles('ADMIN'), getAuditLogs);

export default router;

