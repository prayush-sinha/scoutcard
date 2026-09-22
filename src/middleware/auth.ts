// src/middleware/auth.ts
// JWT verification middleware — protects routes that require authentication.

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AuthRequest, JwtPayload } from '../types';

/**
 * verifyToken — attach req.user or return 401.
 * Usage: router.get('/protected', verifyToken, myHandler)
 */
export function verifyToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  // Accept token from: "Authorization: Bearer <token>" OR cookie
  const token =
    (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined) ??
    (req.cookies?.token as string | undefined);

  if (!token) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, error: 'Token expired. Please log in again.' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid token.' });
    }
  }
}

/**
 * optionalToken — like verifyToken but does NOT reject unauthenticated requests.
 * Sets req.user if a valid token is present; proceeds regardless.
 */
export function optionalToken(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

  if (token) {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
      req.user = decoded;
    } catch {
      // ignore invalid token — just proceed without user
    }
  }
  next();
}
