import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthTokenPayload extends JwtPayload {
    userId: string;
}

interface AuthenticatedRequest extends Request {
    userId?: string;
}

export const verifyToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    const authHeader = req.header('Authorization');
    const token = authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '').trim()
        : req.header('auth-token');

    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    const jwtSecret = process.env.TOKEN_SECRET;

    if (!jwtSecret) {
        res.status(500).json({ message: 'Server configuration error.' });
        return;
    }

    try {
        const decodedToken = jwt.verify(token, jwtSecret) as AuthTokenPayload;

        if (!decodedToken.userId) {
            res.status(401).json({ message: 'Invalid token payload.' });
            return;
        }

        req.userId = decodedToken.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export type { AuthenticatedRequest };
