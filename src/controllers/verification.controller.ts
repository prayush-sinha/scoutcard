// src/controllers/verification.controller.ts
// Handles player Riot ID verification via Tracker.gg trust scoring.

import { Response, NextFunction } from 'express';
import { verifyPlayer, getVerificationStatus } from '../services/verification.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendError } from '../utils/response';

/**
 * POST /api/v1/verification/verify-riot
 * Player submits their Riot ID → we fetch Tracker data and calculate trust score.
 * No user friction — no game edits required.
 *
 * Body: { riotId: "TenZ#NA1" }
 */
export async function verifyRiot(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const { riotId } = req.body as { riotId?: string };

    // Validate input
    if (!riotId || typeof riotId !== 'string' || riotId.trim().length === 0) {
      sendError(res, 'riotId is required. Format: "PlayerName#TAG" (e.g. TenZ#NA1)', 400);
      return;
    }

    const trimmedRiotId = riotId.trim();

    // Must contain # or space separator
    if (!trimmedRiotId.includes('#') && !trimmedRiotId.includes(' ')) {
      sendError(
        res,
        'Invalid Riot ID format. Use "Name#Tag" format (e.g. TenZ#NA1)',
        400
      );
      return;
    }

    const result = await verifyPlayer(playerId, trimmedRiotId);

    sendSuccess(
      res,
      result,
      result.verified
        ? `✅ Verified! Trust score: ${result.trustScore}/100`
        : `⚠️ Not verified. Trust score: ${result.trustScore}/100 — ${result.reason}`
    );
  } catch (err) {
    const message = (err as Error).message;
    if (message === 'INVALID_RIOT_ID') {
      sendError(res, 'Invalid Riot ID format. Use "Name#Tag" (e.g. TenZ#NA1)', 400);
      return;
    }
    next(err);
  }
}

/**
 * GET /api/v1/verification/status
 * Returns the current verification status of the authenticated player.
 */
export async function getStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const status = await getVerificationStatus(playerId);

    if (!status) {
      sendError(res, 'Player not found.', 404);
      return;
    }

    sendSuccess(res, status, 'Verification status retrieved.');
  } catch (err) {
    next(err);
  }
}
