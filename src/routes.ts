import { Router, Request, Response } from 'express';
import authRoutes from './routes/authRoutes';
import libraryEntryRoutes from './routes/libraryEntryRoutes';
import bookRoutes from './routes/bookRoutes';
import profileRoutes from './routes/profileRoutes';
import readerRoutes from './routes/readerRoutes';

const router: Router = Router();

// Root route
router.get('/', (req: Request, res: Response) => {
    res.status(200).send('Welcome to BOOKORA');
});

// Mount auth routes
router.use('/auth', authRoutes);
router.use('/users', profileRoutes);
router.use('/readers', readerRoutes);
router.use('/library', libraryEntryRoutes);
router.use('/books', bookRoutes);

export default router;
