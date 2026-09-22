// src/controllers/player.controller.ts
// Scout Card endpoints: fetch, autosave draft, full save & publish.

import { Response, NextFunction } from 'express';
import {
  getScoutCard,
  saveDraft,
  saveScoutCard,
  calculateCompletionScore,
} from '../services/player.service';
import { AuthRequest, ScoutCardInput } from '../types';
import { sendSuccess, sendError } from '../utils/response';

/**
 * GET /api/v1/players/scout-card
 * Returns the authenticated player's full Scout Card + completion score.
 */
export async function getMyScoutCard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const player = await getScoutCard(playerId);

    if (!player) {
      sendError(res, 'Player not found.', 404);
      return;
    }

    const completionScore = calculateCompletionScore(player);

    sendSuccess(res, { ...player, completionScore }, 'Scout Card retrieved.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/players/scout-card
 * Full Scout Card save.
 * When `isPublished: true` is included, enforces all required fields before publishing.
 *
 * Body: {
 *   division?: PremierDivision,
 *   mainAgents?: string[],      // exactly 2
 *   flexAgent?: string,
 *   playstyleTags?: PlaystyleTag[], // max 2: IGL | Entry | Lurk | Support | Anchor
 *   vodUrl?: string,
 *   availableHours?: number[],  // 0-167 UTC indices
 *   isPublished?: boolean
 * }
 */
export async function updateScoutCard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const input = req.body as ScoutCardInput;

    const result = await saveScoutCard(playerId, input);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed.',
        details: result.errors,
      });
      return;
    }

    const message = result.data.isPublished
      ? '🎉 Scout Card published! You are now discoverable by recruiters.'
      : 'Scout Card saved successfully.';

    sendSuccess(res, result.data, message);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/players/scout-card/draft
 * 30-second autosave — partial updates, no required-field enforcement.
 * Silently saves whatever the player has so far without blocking the UI.
 *
 * Body: Partial<ScoutCardInput>
 */
export async function autosaveDraft(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const input = req.body as ScoutCardInput;

    const result = await saveDraft(playerId, input);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: 'Draft save failed.',
        details: result.errors,
      });
      return;
    }

    sendSuccess(res, result.data, 'Draft saved.');
  } catch (err) {
    next(err);
  }
}
