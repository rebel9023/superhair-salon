import { Router } from 'express';
import {
  createAppointment,
  getAppointments,
  updateAppointmentStatus,
  rescheduleAppointment
} from '../controllers/appointments';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.route('/')
  .get(authenticateJWT, getAppointments)
  .post(authenticateJWT, createAppointment);

router.put('/:id/status', authenticateJWT, updateAppointmentStatus);
router.put('/:id/reschedule', authenticateJWT, rescheduleAppointment);

export default router;
