// src/routes/players.ts
// All /players/* endpoints for Scout Card management.

import { Router } from 'express';
import {
  getMyScoutCard,
  updateScoutCard,
  autosaveDraft,
} from '../controllers/player.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

// All player routes require authentication
router.use(verifyToken);

/**
 * GET /api/v1/players/scout-card
 * Fetch the authenticated player's Scout Card and completion score.
 *
 * Response:
 * {
 *   id, discordUsername, discordAvatar, riotId, isVerified,
 *   trustScore, verificationTier,
 *   division, mainAgents, flexAgent, playstyleTags,
 *   vodUrl, availableHours, isPublished,
 *   completionScore   ← 0–100, shows how complete the profile is
 * }
 */
router.get('/scout-card', getMyScoutCard);

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
router.put('/scout-card', updateScoutCard);

/**
 * POST /api/v1/players/scout-card/draft
 * Silent 30-second autosave — partial updates, no publish validation.
 * Frontend calls this every 30 seconds while the player is filling out the form.
 */
router.post('/scout-card/draft', autosaveDraft);

export default router;
