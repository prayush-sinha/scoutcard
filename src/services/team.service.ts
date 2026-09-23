// src/services/team.service.ts
// Team creation, retrieval, update, and disbanding logic for Phase 2.2.

import prisma from '../lib/prisma';
import { ValorantRole, PREMIER_DIVISIONS, TeamInput, ValidationError } from '../types';
import { isValidAvailabilityHours } from './player.service';
import { isValidUuid } from '../utils/validation';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_ROLES: ValorantRole[] = [
  'Duelist', 'Initiator', 'Controller', 'Sentinel', 'Flex',
];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateTeamInput(
  input: TeamInput,
  mode: 'create' | 'update'
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Team name: required on create, non-empty on update
  if (input.name !== undefined) {
    if (typeof input.name !== 'string' || input.name.trim().length < 2) {
      errors.push({ field: 'name', message: 'Team name must be at least 2 characters.' });
    }
    if (input.name.trim().length > 50) {
      errors.push({ field: 'name', message: 'Team name cannot exceed 50 characters.' });
    }
  } else if (mode === 'create') {
    errors.push({ field: 'name', message: 'Team name is required.' });
  }

  // Division
  if (input.division !== undefined) {
    if (!PREMIER_DIVISIONS.includes(input.division)) {
      errors.push({
        field: 'division',
        message: `Invalid division. Must be one of: ${PREMIER_DIVISIONS.join(', ')}`,
      });
    }
  }

  // Recruiting roles
  if (input.recruitingRoles !== undefined) {
    if (!Array.isArray(input.recruitingRoles) || input.recruitingRoles.length === 0) {
      errors.push({ field: 'recruitingRoles', message: 'At least one recruiting role is required.' });
    } else {
      const invalidRoles = input.recruitingRoles.filter((r) => !VALID_ROLES.includes(r));
      if (invalidRoles.length > 0) {
        errors.push({
          field: 'recruitingRoles',
          message: `Invalid roles: ${invalidRoles.join(', ')}. Allowed: ${VALID_ROLES.join(', ')}`,
        });
      }
    }
  }

  // Required hours (practice schedule)
  if (input.requiredHours !== undefined) {
    if (!isValidAvailabilityHours(input.requiredHours)) {
      errors.push({
        field: 'requiredHours',
        message: 'requiredHours must be an array of integers between 0 and 167.',
      });
    }
  }

  return errors;
}

// ─── Service functions ────────────────────────────────────────────────────────

/**
 * Creates a new team for a captain.
 * Enforces one-team-per-captain at the business logic layer.
 */
export async function createTeam(
  captainId: string,
  input: TeamInput
): Promise<{ success: true; data: object } | { success: false; errors: ValidationError[] }> {
  if (!isValidUuid(captainId)) {
    return {
      success: false,
      errors: [{ field: 'captainId', message: 'Invalid captain ID format.' }],
    };
  }

  const errors = validateTeamInput(input, 'create');
  if (errors.length > 0) return { success: false, errors };

  // One team per captain rule
  const existing = await prisma.team.findFirst({ where: { captainId } });
  if (existing) {
    return {
      success: false,
      errors: [{ field: 'captain', message: 'You already have a team. A captain can only manage one team.' }],
    };
  }

  // Team name uniqueness
  const nameTaken = await prisma.team.findUnique({
    where: { name: input.name!.trim() },
  });
  if (nameTaken) {
    return {
      success: false,
      errors: [{ field: 'name', message: 'This team name is already taken. Please choose another.' }],
    };
  }

  const team = await prisma.team.create({
    data: {
      captainId,
      name: input.name!.trim(),
      division: input.division || null,
      recruitingRoles: input.recruitingRoles ?? [],
      requiredHours: input.requiredHours ?? [],
      isActivelyRecruiting: input.isActivelyRecruiting ?? true,
    },
    select: teamSelectFields,
  });

  return { success: true, data: team };
}

/**
 * Fetches the captain's team along with full application stats per status and accepted roster.
 */
export async function getMyTeam(captainId: string) {
  if (!isValidUuid(captainId)) return null;

  const team = await prisma.team.findFirst({
    where: { captainId },
    select: {
      ...teamSelectFields,
      captain: {
        select: {
          id: true,
          discordUsername: true,
          discordAvatar: true,
          riotId: true,
          isVerified: true,
          trustScore: true,
        },
      },
      applications: {
        select: {
          status: true,
          player: { select: rosterMemberSelect },
        },
      },
    },
  });

  if (!team) return null;

  // Aggregate application counts per status and collect accepted roster members
  const { applications, ...teamData } = team;
  const acceptedRoster = applications
    .filter((a) => a.status === 'Accepted')
    .map((a) => a.player);

  const stats = {
    total: applications.length,
    applied: applications.filter((a) => a.status === 'Applied').length,
    reviewed: applications.filter((a) => a.status === 'Reviewed').length,
    trialing: applications.filter((a) => a.status === 'Trialing').length,
    accepted: acceptedRoster.length,
    rejected: applications.filter((a) => a.status === 'Rejected').length,
  };

  return { ...teamData, roster: acceptedRoster, applicationStats: stats };
}

/**
 * Fetches any team by ID (public view — used by players browsing teams).
 * Includes the captain and accepted roster members.
 */
export async function getTeamById(teamId: string) {
  if (!isValidUuid(teamId)) return null;

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      ...teamSelectFields,
      captain: {
        select: {
          id: true,
          discordUsername: true,
          discordAvatar: true,
          riotId: true,
          isVerified: true,
          trustScore: true,
        },
      },
      applications: {
        where: { status: 'Accepted' },
        select: {
          player: { select: rosterMemberSelect },
        },
      },
    },
  });

  if (!team) return null;

  const { applications, ...teamData } = team;
  const roster = applications.map((a) => a.player);

  return { ...teamData, roster };
}

/**
 * Updates team details. Only the captain may update their own team.
 */
export async function updateTeam(
  teamId: string,
  captainId: string,
  input: TeamInput
): Promise<{ success: true; data: object } | { success: false; errors: ValidationError[]; status?: number }> {
  if (!isValidUuid(teamId) || !isValidUuid(captainId)) {
    return {
      success: false,
      errors: [{ field: 'id', message: 'Invalid team or captain ID format.' }],
      status: 400,
    };
  }

  const errors = validateTeamInput(input, 'update');
  if (errors.length > 0) return { success: false, errors };

  // Verify ownership
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { success: false, errors: [{ field: 'id', message: 'Team not found.' }], status: 404 };
  if (team.captainId !== captainId) {
    return { success: false, errors: [{ field: 'captain', message: 'Only the captain can update this team.' }], status: 403 };
  }

  // Team name uniqueness (only if name is being changed)
  if (input.name && input.name.trim() !== team.name) {
    const nameTaken = await prisma.team.findUnique({ where: { name: input.name.trim() } });
    if (nameTaken) {
      return {
        success: false,
        errors: [{ field: 'name', message: 'This team name is already taken.' }],
      };
    }
  }

  const updated = await prisma.team.update({
    where: { id: teamId },
    data: {
      ...(input.name !== undefined && { name: input.name.trim() }),
      ...(input.division !== undefined && { division: input.division }),
      ...(input.recruitingRoles !== undefined && { recruitingRoles: input.recruitingRoles }),
      ...(input.requiredHours !== undefined && { requiredHours: input.requiredHours }),
      ...(input.isActivelyRecruiting !== undefined && { isActivelyRecruiting: input.isActivelyRecruiting }),
    },
    select: teamSelectFields,
  });

  return { success: true, data: updated };
}

/**
 * Disbands a team. Only the captain can disband their own team.
 * Cascade deletes all applications and status history (via DB cascade).
 */
export async function disbandTeam(
  teamId: string,
  captainId: string
): Promise<{ success: true } | { success: false; error: string; status: number }> {
  if (!isValidUuid(teamId) || !isValidUuid(captainId)) {
    return { success: false, error: 'Invalid team or captain ID format.', status: 400 };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { success: false, error: 'Team not found.', status: 404 };
  if (team.captainId !== captainId) {
    return { success: false, error: 'Only the captain can disband this team.', status: 403 };
  }

  await prisma.team.delete({ where: { id: teamId } });
  return { success: true };
}

// ─── Shared select fields ─────────────────────────────────────────────────────

const rosterMemberSelect = {
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

const teamSelectFields = {
  id: true,
  name: true,
  division: true,
  recruitingRoles: true,
  requiredHours: true,
  isActivelyRecruiting: true,
  captainId: true,
  createdAt: true,
  updatedAt: true,
} as const;
