import { Router } from 'express';
import {
  createCustomer,
  getCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerHistory,
  redeemLoyaltyPoints
} from '../controllers/customers';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getCustomers)
  .post(authenticateJWT, requirePermission('customers:edit'), createCustomer);

router.route('/:id')
  .put(authenticateJWT, requirePermission('customers:edit'), updateCustomer)
  .delete(authenticateJWT, requirePermission('customers:delete'), deleteCustomer);

router.get('/:id/history', authenticateJWT, getCustomerHistory);
router.post('/:id/loyalty/redeem', authenticateJWT, requirePermission('customers:edit'), redeemLoyaltyPoints);

export default router;
