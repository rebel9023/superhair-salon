import { Router } from 'express';
import {
  getInventoryByBranch,
  adjustStock,
  transferStock,
  createPurchaseOrder,
  receivePurchaseOrder
} from '../controllers/inventory';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getInventoryByBranch)
  .post(authenticateJWT, requirePermission('inventory:edit'), adjustStock);

router.post('/transfer', authenticateJWT, requirePermission('inventory:edit'), transferStock);
router.post('/purchase-orders', authenticateJWT, requirePermission('inventory:purchase'), createPurchaseOrder);
router.put('/purchase-orders/:id/receive', authenticateJWT, requirePermission('inventory:purchase'), receivePurchaseOrder);

export default router;
