import { Router, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import { verifyToken } from './middleware/authMiddleware';

const router: Router = Router();

// Root route
router.get('/', (req: Request, res: Response) => {
    res.status(200).send('Welcome to BOOKORA');
});

router.get('/protected', verifyToken, (req: Request, res: Response) => {
    res.status(200).json({ message: 'Access granted to protected route.' });
});

// Mount auth routes
router.use('/auth', authRoutes);

export default router;