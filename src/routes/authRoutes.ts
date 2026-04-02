import { Router } from 'express';
import { loginUser, registerUser, getCurrentUser, updateUserProfile } from '../controllers/authController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

// Authentication routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Get current authenticated user
router.get('/me', verifyToken, getCurrentUser);

// Update user profile
router.patch('/profile', verifyToken, updateUserProfile);

export default router;