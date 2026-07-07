import { Router } from 'express';
import {
  createExpense,
  getExpenses
} from '../controllers/expenses';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getExpenses)
  .post(authenticateJWT, requirePermission('settings:edit'), createExpense);

export default router;
