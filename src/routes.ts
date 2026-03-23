import { Router, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';

const router: Router = Router();

// Root route
router.get('/', (req: Request, res: Response) => {
    res.status(200).send('Welcome to BOOKORA');
});

// Mount auth routes
router.use('/auth', authRoutes);

export default router;