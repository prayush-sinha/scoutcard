// src/routes/applications.ts
// Application submission and listing endpoints for Phase 3.1.

import { Router } from 'express';
import {
  submitApplicationHandler,
  getTeamApplicationsHandler,
  getMyApplicationsHandler,
  withdrawApplicationHandler,
} from '../controllers/application.controller';
import { verifyToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/v1/applications
 * Submit an application to a team.
 *
 * Body: { teamId: string (uuid), message?: string (max 500 chars) }
 */
router.post('/', verifyToken, submitApplicationHandler);

/**
 * GET /api/v1/applications/my-applications
 * Player's own applications, across all teams.
 *
 * IMPORTANT: must come BEFORE any /:id route.
 * Query: ?page=&limit=
 */
router.get('/my-applications', verifyToken, getMyApplicationsHandler);

/**
 * GET /api/v1/applications/team/:teamId
 * Captain-only: all applications submitted to their team.
 *
 * Query: ?status=Applied|Reviewed|Trialing|Accepted|Rejected&page=&limit=
 */
router.get('/team/:teamId', verifyToken, getTeamApplicationsHandler);

/**
 * DELETE /api/v1/applications/:id
 * Withdraw an application. Player-only, own application.
 */
router.delete('/:id', verifyToken, withdrawApplicationHandler);

export default router;
