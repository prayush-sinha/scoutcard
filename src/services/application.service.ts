// src/services/application.service.ts
// Application submission and retrieval logic for Phase 3.1.

import prisma from '../lib/prisma';
import { ValidationError } from '../types';
import { isValidUuid } from '../utils/validation';
import { ParsedPagination } from '../utils/pagination';

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
