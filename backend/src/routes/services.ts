import { Router } from 'express';
import {
  createService,
  getServices,
  updateService,
  deleteService
} from '../controllers/services';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getServices)
  .post(authenticateJWT, requirePermission('services:edit'), createService);

router.route('/:id')
  .put(authenticateJWT, requirePermission('services:edit'), updateService)
  .delete(authenticateJWT, requirePermission('services:edit'), deleteService);

export default router;
