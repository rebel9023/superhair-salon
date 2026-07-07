import { Router } from 'express';
import {
  getSummary,
  getServiceReport,
  getStaffReport,
  getCustomerReport,
  getPaymentReport,
  getSalesChart,
  getRecentBills,
  getTopPerformers,
  getReportsData
} from '../controllers/reports';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

// All report routes require authentication + admin/manager role
const adminOnly = [authenticateJWT, requirePermission('view_reports')];

router.get('/',               authenticateJWT, getReportsData);
router.get('/summary',        authenticateJWT, getSummary);
router.get('/services',       authenticateJWT, getServiceReport);
router.get('/staff',          authenticateJWT, getStaffReport);
router.get('/customers',      authenticateJWT, getCustomerReport);
router.get('/payments',       authenticateJWT, getPaymentReport);
router.get('/sales-chart',    authenticateJWT, getSalesChart);
router.get('/recent-bills',   authenticateJWT, getRecentBills);
router.get('/top-performers', authenticateJWT, getTopPerformers);

export default router;
