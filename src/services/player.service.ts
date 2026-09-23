// src/services/player.service.ts
// Scout Card creation, update, draft save, and player search logic.

import prisma from '../lib/prisma';
import {
  ScoutCardInput,
  PlaystyleTag,
  PREMIER_DIVISIONS,
  PLAYSTYLE_TAGS,
  PremierDivision,
  VALORANT_AGENTS,
  ValidationError,
  PlayerSearchQuery,
  PlayerSearchResult,
} from '../types';
import { scheduleOverlapCount, calculateOverlapWithSet } from '../utils/availability';
import { isValidUuid } from '../utils/validation';

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

// ValidationError is imported from '../types' — the canonical shared definition.
export type { ValidationError };

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

  // Main agents — exactly 2 required to publish, must be valid Valorant agents
  if (input.mainAgents !== undefined) {
    if (!Array.isArray(input.mainAgents) || input.mainAgents.length !== 2) {
      errors.push({ field: 'mainAgents', message: 'Exactly 2 main agents are required.' });
    } else {
      const invalidAgents = input.mainAgents.filter(
        (a) => !(VALORANT_AGENTS as readonly string[]).includes(a)
      );
      if (invalidAgents.length > 0) {
        errors.push({
          field: 'mainAgents',
          message: `Invalid agent(s): ${invalidAgents.join(', ')}. Must be valid Valorant agents.`,
        });
      }
    }
  } else if (mode === 'publish') {
    errors.push({ field: 'mainAgents', message: 'Exactly 2 main agents are required to publish.' });
  }

  // Flex agent — required to publish, must be a valid Valorant agent, and cannot duplicate a main agent
  if (input.flexAgent !== undefined && input.flexAgent !== null) {
    if (!(VALORANT_AGENTS as readonly string[]).includes(input.flexAgent)) {
      errors.push({
        field: 'flexAgent',
        message: `Invalid agent: ${input.flexAgent}. Must be a valid Valorant agent.`,
      });
    }
    if (input.mainAgents?.includes(input.flexAgent)) {
      errors.push({ field: 'flexAgent', message: 'Flex agent cannot be the same as a main agent.' });
    }
  } else if (mode === 'publish') {
    errors.push({ field: 'flexAgent', message: 'A flex agent is required to publish.' });
  }

  // Playstyle tags — max 2 per player, from allowed set.
  // At least 1 is required to publish so teams know how you play.
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

  // Require at least 1 tag to publish (enforced separately so it appears even if field is omitted)
  if (mode === 'publish' && (!input.playstyleTags || input.playstyleTags.length === 0)) {
    errors.push({
      field: 'playstyleTags',
      message: 'At least 1 playstyle tag (IGL | Entry | Lurk | Support | Anchor) is required to publish.',
    });
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
      // vodUrl: undefined → skip update; null → explicitly clear the field
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

// ─── Phase 2.3: Player Search ─────────────────────────────────────────────────

/** Shared Prisma select for public Scout Card fields */
const publicCardSelect = {
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
  updatedAt: true,
} as const;

/**
 * Search published Scout Cards.
 * Applies GIN-backed filters (division, agents, tags, verified) in Postgres,
 * then handles overlap sorting in-application after fetching.
 *
 * Returns { data: PlayerSearchResult[], total: number } for the paginated response.
 */
export async function searchPlayers(query: PlayerSearchQuery): Promise<{
  data: PlayerSearchResult[];
  total: number;
}> {
  const page  = Math.max(1, parseInt(query.page  ?? '1',  10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit ?? '20', 10) || 20));
  const skip  = (page - 1) * limit;

  // ── Parse filter params ────────────────────────────────────────────────────
  const agentList = query.agents
    ? query.agents.split(',').map((a) => a.trim()).filter(Boolean)
    : [];

  const tagList = query.tags
    ? query.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  const verifiedOnly = query.verified === 'true';

  const validDivision = query.division && PREMIER_DIVISIONS.includes(query.division as PremierDivision)
    ? (query.division as PremierDivision)
    : undefined;

  // ── Build Prisma where clause ──────────────────────────────────────────────
  const where = {
    isPublished: true,
    ...(validDivision     && { division: validDivision }),
    ...(verifiedOnly      && { isVerified: true }),
    // GIN `&&` (hasSome) — player mains at least one of the specified agents
    ...(agentList.length > 0 && { mainAgents: { hasSome: agentList } }),
    // GIN `&&` (hasSome) — player has at least one of the specified tags
    ...(tagList.length > 0   && { playstyleTags: { hasSome: tagList } }),
  };

  // ── Sort mode ──────────────────────────────────────────────────────────────
  const sort = query.sort ?? 'recent';

  // For overlap sort we fetch all matches (no skip/take in Postgres) then sort
  // in memory, because Postgres can't ORDER BY a computed set-intersection.
  // The GIN filters keep the candidate set small so this is safe.
  const useOverlapSort = sort === 'overlap';

  let orderBy: object | undefined;
  if (sort === 'trust') {
    orderBy = { trustScore: 'desc' as const };
  } else if (!useOverlapSort) {
    orderBy = { updatedAt: 'desc' as const };
  }

  // ── Fetch team's requiredHours if teamId supplied ─────────────────────────
  let teamRequiredHours: number[] = [];
  if (query.teamId && isValidUuid(query.teamId)) {
    const team = await prisma.team.findUnique({
      where: { id: query.teamId },
      select: { requiredHours: true },
    });
    teamRequiredHours = team?.requiredHours ?? [];
  }

  // ── Query ─────────────────────────────────────────────────────────────────
  if (useOverlapSort) {
    // Stage 1: Fetch only id & availableHours for candidates (drastically reduces DB egress)
    const candidates = await prisma.player.findMany({
      where,
      select: { id: true, availableHours: true },
    });

    const requiredSet = new Set(teamRequiredHours);
    const scored = candidates.map((c) => ({
      id: c.id,
      overlap: calculateOverlapWithSet(c.availableHours, requiredSet),
    }));

    scored.sort((a, b) => b.overlap - a.overlap);

    const total = scored.length;
    const pageSlice = scored.slice(skip, skip + limit);

    if (pageSlice.length === 0) {
      return { data: [], total };
    }

    // Stage 2: Fetch full card details only for the current page
    const pageIds = pageSlice.map((s) => s.id);
    const fullCards = await prisma.player.findMany({
      where: { id: { in: pageIds } },
      select: publicCardSelect,
    });

    const cardMap = new Map(fullCards.map((card) => [card.id, card]));
    const data: PlayerSearchResult[] = pageSlice.map((s) => {
      const card = cardMap.get(s.id)!;
      return {
        ...card,
        division: card.division as string | null,
        scheduleOverlap: s.overlap,
      };
    });

    return { data, total };
  }

  // ── Standard paginated fetch (recent or trust sort) ───────────────────────
  const [rows, total] = await Promise.all([
    prisma.player.findMany({
      where,
      select: publicCardSelect,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.player.count({ where }),
  ]);

  const requiredSet =
    query.teamId && teamRequiredHours.length > 0 ? new Set(teamRequiredHours) : null;

  const data: PlayerSearchResult[] = rows.map((p) => ({
    ...p,
    division: p.division as string | null,
    // Attach overlap count whenever a teamId was provided, even for non-overlap sorts
    ...(query.teamId && {
      scheduleOverlap: requiredSet
        ? calculateOverlapWithSet(p.availableHours, requiredSet)
        : 0,
    }),
  }));

  return { data, total };
}

/**
 * Fetch a single published player's public Scout Card.
 * Returns null if the player doesn't exist or hasn't published their card.
 * Optionally attaches scheduleOverlap if the viewer's teamId is provided.
 */
export async function getPlayerById(
  playerId: string,
  viewerTeamId?: string
): Promise<PlayerSearchResult | null> {
  if (!isValidUuid(playerId)) return null;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { ...publicCardSelect, isPublished: true },
  });

  if (!player || !player.isPublished) return null;

  let scheduleOverlap: number | undefined;
  if (viewerTeamId && isValidUuid(viewerTeamId)) {
    const team = await prisma.team.findUnique({
      where: { id: viewerTeamId },
      select: { requiredHours: true },
    });
    if (team) {
      scheduleOverlap = scheduleOverlapCount(player.availableHours, team.requiredHours);
    }
  }

  const { isPublished: _pub, ...publicFields } = player;

  return {
    ...publicFields,
    division: publicFields.division as string | null,
    ...(scheduleOverlap !== undefined && { scheduleOverlap }),
  };
}
