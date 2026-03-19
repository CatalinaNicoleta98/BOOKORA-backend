import {Router, Request, Response} from 'express';
import { loginUser, registerUser } from './controllers/authController';

const router: Router = Router();

//get, post, put, delete (CRUD)


router.get('/', (req: Request, res: Response) => {

    res.status(200).send('Welcome to BOOKORA');
});


//Authentication routes
router.post('/auth/register', registerUser);
router.post('/auth/login', loginUser);
export default router;