import { NextFunction, Request, Response } from 'express';
import { auth } from '../config/firebase';

type AuthenticatedRequest = Request & {
  user?: {
    uid: string;
    email?: string;
    displayName?: string;
  };
};

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    res.status(401).json({ error: 'Missing bearer token' });
    return;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as AuthenticatedRequest).user = { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
    next();
  } catch {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
}

export const verifyFirebaseToken = authenticateToken;

export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = await auth.verifyIdToken(token);
    (req as AuthenticatedRequest).user = { uid: decoded.uid, email: decoded.email, displayName: decoded.name };
  } catch {
    // Ignore optional auth failures.
  }

  next();
}

export type { AuthenticatedRequest };
