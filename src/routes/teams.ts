// src/routes/teams.ts
// Team management endpoints for Phase 2.2.

import { Router } from 'express';
import {
  createTeamHandler,
  getMyTeamHandler,
  getTeamHandler,
  updateTeamHandler,
  disbandTeamHandler,
} from '../controllers/team.controller';
import { verifyToken, optionalToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/teams
 * Create a new team.
 * One team per captain — returns 400 if the player already has a team.
 *
 * Body: {
 *   name: string (2–50 chars, unique),
 *   division?: PremierDivision,
 *   recruitingRoles?: ValorantRole[],  // Duelist | Initiator | Controller | Sentinel | Flex
 *   requiredHours?: number[],          // 0–167 UTC indices (practice schedule)
 *   isActivelyRecruiting?: boolean     // defaults to true
 * }
 */
router.post('/', verifyToken, createTeamHandler);

/**
 * GET /api/v1/teams/my-team
 * Returns the captain's team WITH full application pipeline stats:
 * { total, applied, reviewed, trialing, accepted, rejected }
 *
 * IMPORTANT: this route must come BEFORE /:id so Express doesn't
 * interpret "my-team" as a team ID.
 */
router.get('/my-team', verifyToken, getMyTeamHandler);

/**
 * GET /api/v1/teams/:id
 * Public team profile — players and anonymous visitors can browse a team before deciding to apply.
 * optionalToken: sets req.user if a token is present, but does NOT reject unauthenticated requests.
 */
router.get('/:id', optionalToken, getTeamHandler);

/**
 * PUT /api/v1/teams/:id
 * Update team details. Captain-only. Any field can be updated.
 *
 * Body: Partial<{
 *   name, division, recruitingRoles, requiredHours, isActivelyRecruiting
 * }>
 */
router.put('/:id', verifyToken, updateTeamHandler);

/**
 * DELETE /api/v1/teams/:id
 * Disband the team. Captain-only.
 * Cascade deletes all applications and status history records.
 */
router.delete('/:id', verifyToken, disbandTeamHandler);

export default router;
