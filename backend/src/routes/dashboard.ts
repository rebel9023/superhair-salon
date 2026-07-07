import { Router } from 'express';
import {
  getDashboardStats
} from '../controllers/dashboard';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/stats', authenticateJWT, getDashboardStats);

export default router;
