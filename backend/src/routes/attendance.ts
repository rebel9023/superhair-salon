import { Router } from 'express';
import {
  clockIn,
  clockOut,
  getAttendanceReport
} from '../controllers/attendance';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.post('/clock-in', authenticateJWT, clockIn);
router.post('/clock-out', authenticateJWT, clockOut);
router.get('/report', authenticateJWT, requirePermission('staff:attendance'), getAttendanceReport);

export default router;
