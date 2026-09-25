// src/services/application.service.ts
// Application submission and retrieval logic for Phase 3.1.

import { ApplicationStatus } from '@prisma/client';
import prisma from '../lib/prisma';
import { ValidationError } from '../types';
import { isValidUuid } from '../utils/validation';
import { ParsedPagination } from '../utils/pagination';
import { createError } from '../middleware/errorHandler';
import { getIO } from '../socket';

// ─── Validation ───────────────────────────────────────────────────────────────

function validateApplicationInput(message?: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (message !== undefined) {
    if (typeof message !== 'string') {
      errors.push({ field: 'message', message: 'Message must be a string.' });
    } else if (message.trim().length > 500) {
      errors.push({ field: 'message', message: 'Message cannot exceed 500 characters.' });
    }
  }

  return errors;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Submits a new application from a player to a team.
 * Enforces UNIQUE(playerId, teamId) at the business logic layer
 * (in addition to the DB constraint) so we can return a clean 409.
 */
export async function submitApplication(
  playerId: string,
  teamId: string,
  message?: string
): Promise<
  | { success: true; data: object }
  | { success: false; errors: ValidationError[]; status?: number }
> {
  if (!isValidUuid(playerId) || !isValidUuid(teamId)) {
    return {
      success: false,
      errors: [{ field: 'id', message: 'Invalid player or team ID format.' }],
      status: 400,
    };
  }

  const errors = validateApplicationInput(message);
  if (errors.length > 0) return { success: false, errors, status: 400 };

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    return { success: false, errors: [{ field: 'teamId', message: 'Team not found.' }], status: 404 };
  }

  if (team.captainId === playerId) {
    return {
      success: false,
      errors: [{ field: 'teamId', message: 'You cannot apply to your own team.' }],
      status: 400,
    };
  }

  const existing = await prisma.application.findUnique({
    where: { uq_application_player_team: { playerId, teamId } },
  });
  if (existing) {
    return {
      success: false,
      errors: [{ field: 'team', message: 'You have already applied to this team.' }],
      status: 409,
    };
  }

  const application = await prisma.application.create({
    data: {
      playerId,
      teamId,
      message: message?.trim() || null,
    },
    select: applicationSelectFields,
  });

  // Initial history entry (fromStatus null → Applied)
  await prisma.applicationStatusHistory.create({
    data: {
      applicationId: application.id,
      fromStatus: null,
      toStatus: 'Applied',
      changedBy: playerId,
    },
  });

  // Notify the team captain
  await prisma.notification.create({
    data: {
      playerId: team.captainId,
      type: 'application:created',
      payload: { applicationId: application.id, teamId, playerId },
    },
  });

  // Real-time notification to the team's room via Socket.io
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { discordUsername: true, riotId: true },
  });

  getIO().to(`team:${teamId}`).emit('application:created', {
    applicationId: application.id,
    playerId,
    playerName: player?.discordUsername ?? player?.riotId ?? 'Player',
    status: application.status,
  });

  return { success: true, data: application };
}

/**
 * Lists applications for a team, optionally filtered by status.
 * Only the team's captain may view its applications.
 */
export async function getTeamApplications(
  teamId: string,
  captainId: string,
  status: string | undefined,
  pagination: ParsedPagination
): Promise<
  | { success: true; data: object[]; total: number }
  | { success: false; error: string; status: number }
> {
  if (!isValidUuid(teamId) || !isValidUuid(captainId)) {
    return { success: false, error: 'Invalid team or captain ID format.', status: 400 };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { success: false, error: 'Team not found.', status: 404 };
  if (team.captainId !== captainId) {
    return { success: false, error: 'Only the captain can view this team\'s applications.', status: 403 };
  }

  const where = {
    teamId,
    ...(status && { status: status as never }),
  };

  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      select: {
        ...applicationSelectFields,
        player: { select: applicantSelectFields },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.application.count({ where }),
  ]);

  return { success: true, data, total };
}

/**
 * Lists a player's own applications across all teams.
 */
export async function getMyApplications(
  playerId: string,
  pagination: ParsedPagination
): Promise<{ success: true; data: object[]; total: number } | { success: false; error: string; status: number }> {
  if (!isValidUuid(playerId)) {
    return { success: false, error: 'Invalid player ID format.', status: 400 };
  }

  const where = { playerId };

  const [data, total] = await Promise.all([
    prisma.application.findMany({
      where,
      select: {
        ...applicationSelectFields,
        team: { select: { id: true, name: true, division: true, recruitingRoles: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: pagination.skip,
      take: pagination.limit,
    }),
    prisma.application.count({ where }),
  ]);

  return { success: true, data, total };
}

/**
 * Withdraws (deletes) a pending application. Player-only, own application.
 */
export async function withdrawApplication(
  applicationId: string,
  playerId: string
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  if (!isValidUuid(applicationId) || !isValidUuid(playerId)) {
    return { success: false, error: 'Invalid application or player ID format.', status: 400 };
  }

  const application = await prisma.application.findUnique({ where: { id: applicationId } });
  if (!application) return { success: false, error: 'Application not found.', status: 404 };
  if (application.playerId !== playerId) {
    return { success: false, error: 'You can only withdraw your own applications.', status: 403 };
  }

  await prisma.application.delete({ where: { id: applicationId } });
  return { success: true };
}

// ─── Shared select fields ─────────────────────────────────────────────────────

const applicantSelectFields = {
  id: true,
  discordUsername: true,
  discordAvatar: true,
  riotId: true,
  isVerified: true,
  trustScore: true,
  division: true,
  mainAgents: true,
  playstyleTags: true,
} as const;

const applicationSelectFields = {
  id: true,
  playerId: true,
  teamId: true,
  status: true,
  message: true,
  captainNotes: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ─── Phase 3.2: Status Management & Kanban Transitions ────────────────────────

// Allowed status transitions (Kanban columns)
const VALID_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  Applied: ['Reviewed', 'Trialing', 'Rejected'],
  Reviewed: ['Trialing', 'Accepted', 'Rejected', 'Applied'],
  Trialing: ['Accepted', 'Rejected', 'Reviewed'],
  Accepted: [], // terminal
  Rejected: ['Applied'], // allow reopening with a reason
};

export interface UpdateStatusInput {
  applicationId: string;
  newStatus: ApplicationStatus;
  changedBy: string; // userId of the team lead / captain making the change
  reason?: string;
}

export async function updateStatus({
  applicationId,
  newStatus,
  changedBy,
  reason,
}: UpdateStatusInput) {
  if (!isValidUuid(applicationId) || !isValidUuid(changedBy)) {
    throw createError('Invalid application or user ID format.', 400);
  }

  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: { team: true },
  });

  if (!application) {
    throw createError('Application not found', 404);
  }

  // Authorization: only the team's captain can update status
  if (application.team.captainId !== changedBy) {
    throw createError('Not authorized to update this application', 403);
  }

  const fromStatus = application.status;

  // Validate transition
  const allowed = VALID_TRANSITIONS[fromStatus] ?? [];
  if (!allowed.includes(newStatus)) {
    throw createError(
      `Invalid transition: ${fromStatus} → ${newStatus}`,
      400
    );
  }

  // Transaction: update status + log history + create notification
  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
      select: applicationSelectFields,
    });

    await tx.applicationStatusHistory.create({
      data: {
        applicationId,
        fromStatus,
        toStatus: newStatus,
        changedBy,
        note: reason ?? null,
      },
    });

    await tx.notification.create({
      data: {
        playerId: application.playerId,
        type: newStatus === 'Accepted' ? 'application:accepted'
             : newStatus === 'Rejected' ? 'application:rejected'
             : 'application:status_changed',
        payload: {
          applicationId,
          teamId: application.teamId,
          fromStatus,
          toStatus: newStatus,
          reason: reason ?? null,
        },
        isRead: false,
      },
    });

    return updated;
  });

  // Emit real-time events via Socket.io
  const io = getIO();

  // Notify everyone viewing the team's Kanban board
  io.to(`team:${application.teamId}`).emit('application:status_changed', {
    applicationId,
    fromStatus,
    toStatus: newStatus,
    changedBy,
  });

  // Notify the player directly (their own room)
  io.to(`user:${application.playerId}`).emit('notification:new', {
    type: newStatus === 'Accepted' ? 'application:accepted'
         : newStatus === 'Rejected' ? 'application:rejected'
         : 'application:status_changed',
    applicationId,
    message: `Your application status changed to ${newStatus}`,
  });

  return result;
}

export async function getStatusHistory(applicationId: string) {
  if (!isValidUuid(applicationId)) {
    throw createError('Invalid application ID format.', 400);
  }

  return prisma.applicationStatusHistory.findMany({
    where: { applicationId },
    orderBy: { changedAt: 'asc' },
  });
}

