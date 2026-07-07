import { Router } from 'express';
import {
  register,
  login,
  logout,
  refresh,
  getProfile,
  forgotPassword,
  resetPassword,
  checkSetupStatus,
  setupAdmin
} from '../controllers/auth';
import { authenticateJWT } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/auth';

const router = Router();

router.get('/setup-status', checkSetupStatus);
router.post('/setup-admin', setupAdmin);
router.post('/register', validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/forgot-password', validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validateRequest(resetPasswordSchema), resetPassword);
router.get('/profile', authenticateJWT, getProfile);

export default router;
