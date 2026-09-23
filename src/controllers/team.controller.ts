// src/controllers/team.controller.ts
// Team management handlers for Phase 2.2.

import { Response, NextFunction } from 'express';
import {
  createTeam,
  getMyTeam,
  getTeamById,
  updateTeam,
  disbandTeam,
} from '../services/team.service';
import { AuthRequest, TeamInput } from '../types';
import { sendSuccess, sendError } from '../utils/response';
import { isValidUuid } from '../utils/validation';

/**
 * POST /api/v1/teams
 * Create a new team. Captain is auto-linked from JWT.
 * One team per captain is enforced.
 *
 * Body: { name, division?, recruitingRoles?, requiredHours?, isActivelyRecruiting? }
 */
export async function createTeamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captainId = req.user!.userId;
    const input = req.body as TeamInput;

    const result = await createTeam(captainId, input);

    if (!result.success) {
      res.status(400).json({ success: false, error: 'Validation failed.', details: result.errors });
      return;
    }

    sendSuccess(res, result.data, '🏆 Team created successfully!', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/teams/my-team
 * Returns the captain's team with full application pipeline stats.
 */
export async function getMyTeamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captainId = req.user!.userId;
    const team = await getMyTeam(captainId);

    if (!team) {
      sendError(res, 'You have not created a team yet.', 404);
      return;
    }

    sendSuccess(res, team, 'Team retrieved.');
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/teams/:id
 * Public team profile — used by players browsing teams before applying.
 */
export async function getTeamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidUuid(id)) {
      sendError(res, 'Team not found.', 404);
      return;
    }

    const team = await getTeamById(id);

    if (!team) {
      sendError(res, 'Team not found.', 404);
      return;
    }

    sendSuccess(res, team, 'Team retrieved.');
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/teams/:id
 * Update team details. Only the captain can update their team.
 *
 * Body: Partial<TeamInput> — any combination of fields to update.
 */
export async function updateTeamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captainId = req.user!.userId;
    const id = req.params.id as string;

    if (!isValidUuid(id)) {
      sendError(res, 'Team not found.', 404);
      return;
    }

    const input = req.body as TeamInput;

    const result = await updateTeam(id, captainId, input);

    if (!result.success) {
      const status = 'status' in result ? (result.status ?? 400) : 400;
      res.status(status).json({ success: false, error: 'Update failed.', details: result.errors });
      return;
    }

    sendSuccess(res, result.data, 'Team updated successfully.');
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/teams/:id
 * Disband the team. Only the captain can do this.
 * Cascade deletes all applications and status history.
 */
export async function disbandTeamHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captainId = req.user!.userId;
    const id = req.params.id as string;

    if (!isValidUuid(id)) {
      sendError(res, 'Team not found.', 404);
      return;
    }

    const result = await disbandTeam(id, captainId);

    if (!result.success) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    sendSuccess(res, null, 'Team disbanded. All applications have been removed.');
  } catch (err) {
    next(err);
  }
}
