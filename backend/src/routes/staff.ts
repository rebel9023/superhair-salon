import { Router } from 'express';
import {
  createStaff,
  getStaff,
  getStaffById,
  updateStaff
} from '../controllers/staff';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getStaff)
  .post(authenticateJWT, requirePermission('staff:edit'), createStaff);

router.route('/:id')
  .get(authenticateJWT, getStaffById)
  .put(authenticateJWT, requirePermission('staff:edit'), updateStaff);

export default router;
