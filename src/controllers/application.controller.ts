// src/controllers/application.controller.ts
// Application submission and listing handlers for Phase 3.1.

import { Response, NextFunction } from 'express';
import {
  submitApplication,
  getTeamApplications,
  getMyApplications,
  withdrawApplication,
  updateStatus,
  getStatusHistory,
} from '../services/application.service';
import { AuthRequest } from '../types';
import { sendSuccess, sendPaginated } from '../utils/response';
import { parsePagination } from '../utils/pagination';

/**
 * POST /api/v1/applications
 * Player applies to a team.
 *
 * Body: { teamId: string, message?: string }
 */
export async function submitApplicationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const { teamId, message } = req.body as { teamId: string; message?: string };

    const result = await submitApplication(playerId, teamId, message);

    if (!result.success) {
      res
        .status(result.status ?? 400)
        .json({ success: false, error: 'Application failed.', details: result.errors });
      return;
    }

    sendSuccess(res, result.data, '📨 Application submitted!', 201);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/applications/team/:teamId
 * Captain views all applications to their team. Supports ?status= filter + pagination.
 */
export async function getTeamApplicationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const captainId = req.user!.userId;
    const teamId = req.params.teamId as string;
    const status = req.query.status as string | undefined;
    const pagination = parsePagination(req.query.page as string, req.query.limit as string);

    const result = await getTeamApplications(teamId, captainId, status, pagination);

    if (!result.success) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    sendPaginated(res, result.data, {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/applications/my-applications
 * Player views their own applications across all teams.
 */
export async function getMyApplicationsHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const pagination = parsePagination(req.query.page as string, req.query.limit as string);

    const result = await getMyApplications(playerId, pagination);

    if (!result.success) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    sendPaginated(res, result.data, {
      page: pagination.page,
      limit: pagination.limit,
      total: result.total,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/applications/:id
 * Player withdraws their own application.
 */
export async function withdrawApplicationHandler(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const playerId = req.user!.userId;
    const id = req.params.id as string;

    const result = await withdrawApplication(id, playerId);

    if (!result.success) {
      res.status(result.status).json({ success: false, error: result.error });
      return;
    }

    sendSuccess(res, null, 'Application withdrawn.');
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/v1/applications/:id/status
 * Team captain updates status of an application.
 */
export async function updateApplicationStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const { status, reason } = req.body;
    const userId = req.user!.userId; // from auth middleware

    const updated = await updateStatus({
      applicationId: id,
      newStatus: status,
      changedBy: userId,
      reason,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/applications/:id/history
 * View status history of an application.
 */
export async function getApplicationHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = req.params.id as string;
    const history = await getStatusHistory(id);
    res.status(200).json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

