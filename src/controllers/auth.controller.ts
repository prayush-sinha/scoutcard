// src/controllers/auth.controller.ts
// Express request handlers for Discord OAuth endpoints.

import { Request, Response, NextFunction } from 'express';
import {
  getDiscordAuthUrl,
  handleDiscordCallback,
  getPlayerFromJwt,
} from '../services/auth.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { env } from '../config/env';

/**
 * GET /api/v1/auth/discord
 * Redirects the browser to Discord's OAuth consent screen.
 */
export async function discordAuth(_req: Request, res: Response): Promise<void> {
  if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
    res.status(503).json({
      success: false,
      error: 'Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env',
    });
    return;
  }

  const { url } = getDiscordAuthUrl();
  res.redirect(url);
}

/**
 * GET /api/v1/auth/discord/callback
 * Discord redirects here after the user authorizes (or denies).
 */
export async function discordCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Guard: callback shouldn't be reachable if Discord OAuth isn't configured,
    // but protect against direct hits to the URL without credentials set up.
    if (!env.DISCORD_CLIENT_ID || !env.DISCORD_CLIENT_SECRET) {
      res.status(503).json({
        success: false,
        error: 'Discord OAuth is not configured. Set DISCORD_CLIENT_ID and DISCORD_CLIENT_SECRET in .env',
      });
      return;
    }

    const { code, state, error, error_description } = req.query as Record<string, string>;

    // User denied authorization on Discord's side
    if (error) {
      res.redirect(
        `${env.CLIENT_URL}/auth/error?message=${encodeURIComponent(
          error_description ?? 'Discord authorization was denied.'
        )}`
      );
      return;
    }

    if (!code || !state) {
      res.redirect(`${env.CLIENT_URL}/auth/error?message=Missing+OAuth+parameters`);
      return;
    }

    const { token, isNewUser } = await handleDiscordCallback(code, state);

    // Redirect to frontend with JWT in query param.
    // In production you may prefer an httpOnly cookie instead.
    const redirectUrl = new URL(`${env.CLIENT_URL}/auth/success`);
    redirectUrl.searchParams.set('token', token);
    redirectUrl.searchParams.set('new_user', isNewUser ? '1' : '0');

    res.redirect(redirectUrl.toString());
  } catch (err) {
    const message = (err as Error).message;

    if (message === 'INVALID_STATE') {
      res.redirect(`${env.CLIENT_URL}/auth/error?message=Invalid+or+expired+OAuth+state`);
      return;
    }

    if (message === 'DISCORD_TOKEN_EXCHANGE_FAILED') {
      res.redirect(`${env.CLIENT_URL}/auth/error?message=Discord+token+exchange+failed`);
      return;
    }

    next(err); // pass unexpected errors to global error handler
  }
}

/**
 * GET /api/v1/auth/me
 * Returns the currently authenticated player's profile.
 * Protected by verifyToken middleware.
 */
export async function getMe(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const player = await getPlayerFromJwt(req.user!.userId);

    if (!player) {
      sendError(res, 'Player not found.', 404);
      return;
    }

    sendSuccess(res, player, 'Authenticated player profile');
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/auth/logout
 * Client-side JWT logout — instructs the frontend to discard its token.
 * (JWTs are stateless; true server-side invalidation requires a token blocklist.)
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  // Clear cookie if you're using one
  res.clearCookie('token', { path: '/' });
  sendSuccess(res, null, 'Logged out successfully.');
}
