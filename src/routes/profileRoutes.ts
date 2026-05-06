import { Router } from 'express';
import { getCurrentUser, updateUserProfile } from '../controllers/profileController';
import { verifyToken } from '../middleware/authMiddleware';
import { profileImageUpload } from '../middleware/uploadMiddleware';

const router = Router();

router.get('/me', verifyToken, getCurrentUser);
router.patch(
  '/me',
  verifyToken,
  profileImageUpload.fields([
    { name: 'avatar', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
  ]),
  updateUserProfile
);

export default router;
