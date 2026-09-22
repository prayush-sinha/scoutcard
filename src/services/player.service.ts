// src/services/player.service.ts
// Scout Card creation, update, draft save, and player search logic.

import prisma from '../lib/prisma';
import {
  ScoutCardInput,
  PlaystyleTag,
  PREMIER_DIVISIONS,
  PLAYSTYLE_TAGS,
  PremierDivision,
} from '../types';

// ─── VOD URL validation ───────────────────────────────────────────────────────

const VOD_PATTERNS = [
  /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]{11}/,   // YouTube full
  /^https?:\/\/youtu\.be\/[\w-]{11}/,                        // YouTube short
  /^https?:\/\/(www\.)?youtube\.com\/shorts\/[\w-]{11}/,    // YouTube shorts
  /^https?:\/\/medal\.tv\/(games\/[\w-]+\/)?clips?\/.+/,    // Medal.tv clips
];

export function isValidVodUrl(url: string): boolean {
  return VOD_PATTERNS.some((pattern) => pattern.test(url));
}

// ─── Availability hours validation ────────────────────────────────────────────

export function isValidAvailabilityHours(hours: unknown): hours is number[] {
  if (!Array.isArray(hours)) return false;
  if (hours.length > 168) return false;
  return hours.every(
    (h) => typeof h === 'number' && Number.isInteger(h) && h >= 0 && h <= 167
  );
}

// ─── Scout card validation ────────────────────────────────────────────────────

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Full validation for publishing a Scout Card.
 * Draft saves skip required-field checks.
 */
export function validateScoutCard(
  input: ScoutCardInput,
  mode: 'publish' | 'draft'
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Division
  if (input.division !== undefined) {
    if (!PREMIER_DIVISIONS.includes(input.division as PremierDivision)) {
      errors.push({
        field: 'division',
        message: `Invalid division. Must be one of: ${PREMIER_DIVISIONS.join(', ')}`,
      });
    }
  } else if (mode === 'publish') {
    errors.push({ field: 'division', message: 'Premier division is required to publish.' });
  }

  // Main agents — exactly 2 required to publish
  if (input.mainAgents !== undefined) {
    if (!Array.isArray(input.mainAgents) || input.mainAgents.length !== 2) {
      errors.push({ field: 'mainAgents', message: 'Exactly 2 main agents are required.' });
    }
    if (input.flexAgent && input.mainAgents?.includes(input.flexAgent)) {
      errors.push({ field: 'flexAgent', message: 'Flex agent cannot be the same as a main agent.' });
    }
  } else if (mode === 'publish') {
    errors.push({ field: 'mainAgents', message: 'Exactly 2 main agents are required to publish.' });
  }

  // Flex agent — required to publish
  if (mode === 'publish' && !input.flexAgent) {
    errors.push({ field: 'flexAgent', message: 'A flex agent is required to publish.' });
  }

  // Playstyle tags — max 2, from allowed set
  if (input.playstyleTags !== undefined) {
    if (input.playstyleTags.length > 2) {
      errors.push({ field: 'playstyleTags', message: 'Maximum 2 playstyle tags allowed.' });
    }
    const invalidTags = input.playstyleTags.filter(
      (t) => !PLAYSTYLE_TAGS.includes(t as PlaystyleTag)
    );
    if (invalidTags.length > 0) {
      errors.push({
        field: 'playstyleTags',
        message: `Invalid tags: ${invalidTags.join(', ')}. Allowed: ${PLAYSTYLE_TAGS.join(', ')}`,
      });
    }
  }

  // VOD URL
  if (input.vodUrl !== undefined && input.vodUrl !== null) {
    if (!isValidVodUrl(input.vodUrl)) {
      errors.push({
        field: 'vodUrl',
        message: 'VOD URL must be a YouTube (watch/short/shorts) or Medal.tv clip link.',
      });
    }
  } else if (mode === 'publish') {
    errors.push({ field: 'vodUrl', message: 'A VOD clip link is required to publish.' });
  }

  // Availability hours
  if (input.availableHours !== undefined) {
    if (!isValidAvailabilityHours(input.availableHours)) {
      errors.push({
        field: 'availableHours',
        message: 'availableHours must be an array of integers between 0 and 167.',
      });
    }
  } else if (mode === 'publish') {
    errors.push({
      field: 'availableHours',
      message: 'Availability schedule is required to publish.',
    });
  }

  return errors;
}

// ─── Scout Card service functions ─────────────────────────────────────────────

/** Fetch the current player's full Scout Card. */
export async function getScoutCard(playerId: string) {
  return prisma.player.findUnique({
    where: { id: playerId },
    select: {
      id: true,
      discordUsername: true,
      discordAvatar: true,
      riotId: true,
      isVerified: true,
      trustScore: true,
      verificationTier: true,
      division: true,
      mainAgents: true,
      flexAgent: true,
      playstyleTags: true,
      vodUrl: true,
      availableHours: true,
      isPublished: true,
      updatedAt: true,
    },
  });
}

/** Save a draft — partial update, no required-field enforcement. */
export async function saveDraft(playerId: string, input: ScoutCardInput) {
  const errors = validateScoutCard(input, 'draft');
  if (errors.length > 0) return { success: false as const, errors };

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      ...(input.division !== undefined && { division: input.division }),
      ...(input.mainAgents !== undefined && { mainAgents: input.mainAgents }),
      ...(input.flexAgent !== undefined && { flexAgent: input.flexAgent }),
      ...(input.playstyleTags !== undefined && { playstyleTags: input.playstyleTags }),
      ...(input.vodUrl !== undefined && { vodUrl: input.vodUrl }),
      ...(input.availableHours !== undefined && { availableHours: input.availableHours }),
      // Never flip isPublished in a draft save
    },
    select: { id: true, updatedAt: true },
  });

  return { success: true as const, data: player };
}

/** Full save + optional publish — enforces all required fields when publishing. */
export async function saveScoutCard(playerId: string, input: ScoutCardInput) {
  const mode = input.isPublished ? 'publish' : 'draft';
  const errors = validateScoutCard(input, mode);
  if (errors.length > 0) return { success: false as const, errors };

  const player = await prisma.player.update({
    where: { id: playerId },
    data: {
      ...(input.division !== undefined && { division: input.division }),
      ...(input.mainAgents !== undefined && { mainAgents: input.mainAgents }),
      ...(input.flexAgent !== undefined && { flexAgent: input.flexAgent }),
      ...(input.playstyleTags !== undefined && { playstyleTags: input.playstyleTags }),
      ...(input.vodUrl !== undefined && { vodUrl: input.vodUrl }),
      ...(input.availableHours !== undefined && { availableHours: input.availableHours }),
      ...(input.isPublished !== undefined && { isPublished: input.isPublished }),
    },
    select: {
      id: true,
      division: true,
      mainAgents: true,
      flexAgent: true,
      playstyleTags: true,
      vodUrl: true,
      availableHours: true,
      isPublished: true,
      updatedAt: true,
    },
  });

  return { success: true as const, data: player };
}

/** Calculate what percentage of the Scout Card is complete (0–100). */
export function calculateCompletionScore(player: {
  division: string | null;
  mainAgents: string[];
  flexAgent: string | null;
  playstyleTags: string[];
  vodUrl: string | null;
  availableHours: number[];
  riotId: string | null;
  isVerified: boolean;
}): number {
  let score = 0;
  if (player.riotId) score += 15;                          // Riot ID linked
  if (player.isVerified) score += 10;                      // Verified badge
  if (player.division) score += 15;                        // Division selected
  if (player.mainAgents.length === 2) score += 20;         // Both main agents set
  if (player.flexAgent) score += 10;                       // Flex agent set
  if (player.playstyleTags.length > 0) score += 10;        // At least 1 playstyle tag
  if (player.vodUrl) score += 10;                          // VOD link uploaded
  if (player.availableHours.length > 0) score += 10;       // Availability set
  return Math.min(100, score);
}
