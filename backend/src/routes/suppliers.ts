import { Router } from 'express';
import {
  createSupplier,
  getSuppliers,
  updateSupplier,
  deleteSupplier
} from '../controllers/suppliers';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getSuppliers)
  .post(authenticateJWT, requirePermission('inventory:edit'), createSupplier);

router.route('/:id')
  .put(authenticateJWT, requirePermission('inventory:edit'), updateSupplier)
  .delete(authenticateJWT, requirePermission('inventory:edit'), deleteSupplier);

export default router;
