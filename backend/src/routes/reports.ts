import { Router } from 'express';
import { getReportsData } from '../controllers/reports';
import { authenticateJWT } from '../middlewares/auth';

const router = Router();

router.get('/', authenticateJWT, getReportsData);

export default router;
