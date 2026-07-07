import { Router } from 'express';
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch
} from '../controllers/branches';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getBranches)
  .post(authenticateJWT, requirePermission('branches:edit'), createBranch);

router.route('/:id')
  .get(authenticateJWT, getBranchById)
  .put(authenticateJWT, requirePermission('branches:edit'), updateBranch)
  .delete(authenticateJWT, requirePermission('branches:edit'), deleteBranch);

export default router;
