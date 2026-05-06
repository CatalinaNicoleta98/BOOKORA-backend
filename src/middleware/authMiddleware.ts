import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthTokenPayload extends JwtPayload {
    userId: string;
}

interface AuthenticatedRequest extends Request {
    userId?: string;
}

function extractToken(req: Request): string | undefined {
    const authHeader = req.header('Authorization');
    return authHeader?.startsWith('Bearer ')
        ? authHeader.replace('Bearer ', '').trim()
        : req.header('auth-token');
}

function decodeUserIdFromRequest(req: Request): string | null {
    const token = extractToken(req);

    if (!token) {
        return null;
    }

    const jwtSecret = process.env.TOKEN_SECRET;

    if (!jwtSecret) {
        throw new Error('Server configuration error.');
    }

    try {
        const decodedToken = jwt.verify(token, jwtSecret) as AuthTokenPayload;

        if (!decodedToken.userId) {
            return null;
        }

        return decodedToken.userId;
    } catch {
        return null;
    }
}

export const verifyToken = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    const token = extractToken(req);

    if (!token) {
        res.status(401).json({ message: 'Access denied. No token provided.' });
        return;
    }

    try {
        const userId = decodeUserIdFromRequest(req);

        if (!userId) {
            res.status(401).json({ message: 'Invalid or expired token.' });
            return;
        }

        req.userId = userId;
        next();
    } catch (error) {
        if (error instanceof Error && error.message === 'Server configuration error.') {
            res.status(500).json({ message: 'Server configuration error.' });
            return;
        }

        res.status(401).json({ message: 'Invalid or expired token.' });
    }
};

export const attachOptionalUser = (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): void => {
    try {
        const userId = decodeUserIdFromRequest(req);

        if (userId) {
            req.userId = userId;
        }

        next();
    } catch (error) {
        if (error instanceof Error && error.message === 'Server configuration error.') {
            res.status(500).json({ message: 'Server configuration error.' });
            return;
        }

        next();
    }
};

export type { AuthenticatedRequest };
