import { Router } from 'express';
import {
  generateMonthlyPayroll,
  getPayrollRecords
} from '../controllers/payroll';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, requirePermission('payroll:view'), getPayrollRecords)
  .post(authenticateJWT, requirePermission('payroll:process'), generateMonthlyPayroll);

export default router;
