import { Router } from 'express';
import { getCurrentUser, updateUserProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/authMiddleware';

const router = Router();

router.get('/me', verifyToken, getCurrentUser);
router.patch('/me', verifyToken, updateUserProfile);

export default router;
