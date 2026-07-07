import { Router } from 'express';
import {
  createCategory,
  getCategories,
  updateCategory,
  deleteCategory
} from '../controllers/categories';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getCategories)
  .post(authenticateJWT, requirePermission('services:edit'), createCategory);

router.route('/:id')
  .put(authenticateJWT, requirePermission('services:edit'), updateCategory)
  .delete(authenticateJWT, requirePermission('services:edit'), deleteCategory);

export default router;
