import { Router } from 'express';
import {
  checkoutInvoice,
  getInvoices,
  getInvoiceById,
  refundInvoice
} from '../controllers/invoices';
import { authenticateJWT, requirePermission } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getInvoices)
  .post(authenticateJWT, requirePermission('billing:create'), checkoutInvoice);

router.route('/:id')
  .get(authenticateJWT, getInvoiceById);

router.post('/:id/refund', authenticateJWT, requirePermission('billing:void'), refundInvoice);

export default router;
