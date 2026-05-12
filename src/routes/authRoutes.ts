import { Router } from 'express';
import {
  forgotPassword,
  loginUser,
  registerUser,
  resetPassword
} from '../controllers/authController';

const router = Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
