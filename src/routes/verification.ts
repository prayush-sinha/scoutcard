// src/routes/verification.ts
// Verification endpoints for Riot ID trust-score based verification.

import { Router } from 'express';
import { verifyRiot, getStatus } from '../controllers/verification.controller';
import { verifyToken } from '../middleware/auth';
import { verifyRateLimiter } from '../middleware/rateLimiter';

const router = Router();

// All verification routes require authentication
router.use(verifyToken);

/**
 * POST /api/v1/verification/verify-riot
 * Submit Riot ID → get trust score + verification status back immediately.
 * Rate limited to 5 attempts per 5 minutes (protects Tracker.gg API).
 *
 * Body: { riotId: "TenZ#NA1" }
 *
 * Response:
 * {
 *   verified: true,
 *   tier: "verified",
 *   badge: "✅ Verified",
 *   trustScore: 80,
 *   breakdown: { matchesScore: 30, activityScore: 20, rankScore: 20, timePlayedScore: 10 },
 *   trackerData: { rank: "Diamond 2", matchesPlayed: 423, hoursPlayed: 312, ... }
 * }
 */
router.post('/verify-riot', verifyRateLimiter, verifyRiot);

/**
 * GET /api/v1/verification/status
 * Returns the player's current verification state without re-calling Tracker.gg.
 */
router.get('/status', getStatus);

export default router;
