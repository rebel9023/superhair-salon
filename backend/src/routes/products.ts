import { Router } from 'express';
import {
  createProduct,
  getProducts,
  updateProduct,
  deleteProduct
} from '../controllers/products';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getProducts)
  .post(authenticateJWT, requirePermission('inventory:edit'), createProduct);

router.route('/:id')
  .put(authenticateJWT, requirePermission('inventory:edit'), updateProduct)
  .delete(authenticateJWT, requirePermission('inventory:edit'), deleteProduct);

export default router;
