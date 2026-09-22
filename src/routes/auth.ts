// src/routes/auth.ts
// Mounts all /auth/* endpoints with appropriate rate limiting.

import { Router } from 'express';
import { discordAuth, discordCallback, getMe, logout } from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

const router = Router();

/**
 * GET  /api/v1/auth/discord
 * Initiates Discord OAuth flow — redirects to Discord consent screen.
 */
router.get('/discord', authRateLimiter, discordAuth);

/**
 * GET  /api/v1/auth/discord/callback
 * Discord calls this URL after user authorizes (or denies).
 * State param is validated inside the service to prevent CSRF.
 */
router.get('/discord/callback', discordCallback);

/**
 * GET  /api/v1/auth/me
 * Returns the current player's profile.
 * Requires a valid JWT in the Authorization header.
 */
router.get('/me', verifyToken, getMe);

/**
 * POST /api/v1/auth/logout
 * Clears token cookie. Frontend should also discard its stored JWT.
 */
router.post('/logout', verifyToken, logout);

export default router;
