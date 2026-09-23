// src/routes/players.ts
// All /players/* endpoints.
// Public routes use optionalToken; Scout Card management routes require verifyToken.

import { Router } from 'express';
import {
  getMyScoutCard,
  updateScoutCard,
  autosaveDraft,
  searchPlayersHandler,
  getPlayerProfileHandler,
} from '../controllers/player.controller';
import { verifyToken, optionalToken } from '../middleware/auth';

const router = Router();

// ── Public routes (Phase 2.3) ─────────────────────────────────────────────────

/**
 * GET /api/v1/players/search
 * Filtered, sorted, paginated Scout Card search.
 * No auth required — anonymous visitors and logged-in recruiters both use this.
 *
 * Query params:
 *   division    — "Open" | "Intermediate" | "Advanced" | "Elite" | "Contender" | "Invite" | "EsportsOrg"
 *   agents      — comma-separated agent names (e.g. "Jett,Omen") — GIN overlap match
 *   tags        — comma-separated tags (e.g. "IGL,Entry") — GIN overlap match
 *   verified    — "true" to restrict to verified players only
 *   teamId      — UUID; attaches scheduleOverlap per result; required for sort=overlap
 *   sort        — "recent" (default) | "trust" | "overlap"
 *   page        — page number (default: 1)
 *   limit       — results per page (default: 20, max: 50)
 */
router.get('/search', optionalToken, searchPlayersHandler);

/**
 * GET /api/v1/players/:id
 * Public Scout Card profile for a single player.
 * Returns 404 if the player hasn't published their card.
 *
 * Optional query param:
 *   teamId — UUID; if provided, attaches scheduleOverlap to the response
 *
 * IMPORTANT: this route must come AFTER /search (and /scout-card below) so
 * Express doesn't swallow those string paths as UUIDs.
 */

// ── Protected routes (Scout Card management) ──────────────────────────────────

/**
 * GET /api/v1/players/scout-card
 * Returns the authenticated player's full Scout Card + completion score.
 *
 * Response includes completionScore (0–100) showing how complete the profile is.
 */
router.get('/scout-card', verifyToken, getMyScoutCard);

/**
 * PUT /api/v1/players/scout-card
 * Full save or publish of the Scout Card.
 *
 * To PUBLISH: include `"isPublished": true` — all required fields are enforced.
 * To SAVE DRAFT: omit isPublished or set `"isPublished": false`.
 *
 * Required to publish:
 *   division, mainAgents (exactly 2), flexAgent,
 *   playstyleTags (1–2, from: IGL|Entry|Lurk|Support|Anchor),
 *   vodUrl (YouTube or Medal.tv), availableHours
 */
router.put('/scout-card', verifyToken, updateScoutCard);

/**
 * POST /api/v1/players/scout-card/draft
 * Silent 30-second autosave — partial updates, no publish validation.
 * Frontend calls this every 30 seconds while the player is filling out the form.
 */
router.post('/scout-card/draft', verifyToken, autosaveDraft);

/**
 * GET /api/v1/players/:id  (registered last — must come after all named routes)
 */
router.get('/:id', optionalToken, getPlayerProfileHandler);

export default router;
