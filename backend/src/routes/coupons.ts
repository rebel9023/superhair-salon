import { Router } from 'express';
import {
  createCoupon,
  getCoupons,
  validateCoupon
} from '../controllers/coupons';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getCoupons)
  .post(authenticateJWT, requirePermission('settings:edit'), createCoupon);

router.get('/validate', authenticateJWT, validateCoupon);

export default router;
