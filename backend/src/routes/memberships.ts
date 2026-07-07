import { Router } from 'express';
import {
  createMembership,
  getMemberships,
  subscribeCustomer,
  checkCustomerMembership
} from '../controllers/memberships';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getMemberships)
  .post(authenticateJWT, requirePermission('settings:edit'), createMembership);

router.post('/subscribe', authenticateJWT, requirePermission('customers:edit'), subscribeCustomer);
router.get('/check/:customerId', authenticateJWT, checkCustomerMembership);

export default router;
