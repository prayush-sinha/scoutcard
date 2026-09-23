// src/controllers/player.controller.ts
// Scout Card endpoints: fetch, autosave draft, full save & publish, search.

import { Response, NextFunction } from 'express';
import {
  getScoutCard,
  saveDraft,
  saveScoutCard,
  calculateCompletionScore,
  searchPlayers,
  getPlayerById,
} from '../services/player.service';
import {
  AuthRequest,
  ScoutCardInput,
  PlayerSearchQuery,
  PREMIER_DIVISIONS,
  PremierDivision,
} from '../types';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { isValidUuid } from '../utils/validation';

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

    let message: string;
    if (result.data.isPublished) {
      message = '🎉 Scout Card published! You are now discoverable by recruiters.';
    } else if (input.isPublished === false) {
      message = 'Scout Card unpublished. You are no longer discoverable by recruiters.';
    } else {
      message = 'Scout Card saved successfully.';
    }

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

/**
 * GET /api/v1/players/search
 * Paginated, filtered Scout Card search — public (optionalToken).
 *
 * Query params:
 *   division    — exact division (e.g. "Elite")
 *   agents      — comma-separated agent names; player must main at least one
 *   tags        — comma-separated playstyle tags; player must have at least one
 *   verified    — "true" to show only verified players
 *   teamId      — UUID; enables scheduleOverlap field; REQUIRED for sort=overlap
 *   sort        — "recent" (default) | "trust" | "overlap"
 *   page        — page number (default: 1)
 *   limit       — results per page (default: 20, max: 50)
 */
export async function searchPlayersHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const query = req.query as PlayerSearchQuery;

    // Validate division if provided
    if (query.division && !PREMIER_DIVISIONS.includes(query.division as PremierDivision)) {
      sendError(
        res,
        `Invalid division "${query.division}". Must be one of: ${PREMIER_DIVISIONS.join(', ')}`,
        400
      );
      return;
    }

    // Validate sort parameter if provided
    const ALLOWED_SORTS = ['recent', 'trust', 'overlap'];
    if (query.sort && !ALLOWED_SORTS.includes(query.sort)) {
      sendError(
        res,
        `Invalid sort "${query.sort}". Must be one of: ${ALLOWED_SORTS.join(', ')}`,
        400
      );
      return;
    }

    // Overlap sort requires a teamId so we know which practice hours to measure against
    if (query.sort === 'overlap' && !query.teamId) {
      sendError(res, 'teamId is required when sort=overlap.', 400);
      return;
    }

    // Validate teamId format if provided
    if (query.teamId && !isValidUuid(query.teamId)) {
      sendError(res, 'Invalid teamId format. Must be a valid UUID.', 400);
      return;
    }

    const page  = Math.max(1, parseInt(query.page  ?? '1',  10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));

    const { data, total } = await searchPlayers(query);

    sendPaginated(res, data, { page, limit, total });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/players/:id
 * Public profile of a single published Scout Card.
 * Returns 404 if the player does not exist or has not published their card.
 *
 * Optional query param:
 *   teamId — UUID; if provided, adds scheduleOverlap to the response
 */
export async function getPlayerProfileHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.params.id as string;
    const teamId   = req.query.teamId as string | undefined;

    if (!isValidUuid(playerId)) {
      sendError(res, 'Player not found or Scout Card is not published.', 404);
      return;
    }

    if (teamId && !isValidUuid(teamId)) {
      sendError(res, 'Invalid teamId format. Must be a valid UUID.', 400);
      return;
    }

    const player = await getPlayerById(playerId, teamId);

    if (!player) {
      sendError(res, 'Player not found or Scout Card is not published.', 404);
      return;
    }

    sendSuccess(res, player, 'Player profile retrieved.');
  } catch (err) {
    next(err);
  }
}
