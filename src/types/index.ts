// src/types/index.ts
// Shared TypeScript types used across the backend.

import { Request } from 'express';

// ─── JWT payload shape ───────────────────────────────────────────────────────

export interface JwtPayload {
  userId: string;       // UUID from players table
  discordId: string;
  iat?: number;
  exp?: number;
}

// ─── Authenticated request (augments Express Request) ────────────────────────

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// ─── Generic API response wrappers ───────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

// ─── Shared validation types ──────────────────────────────────────────────────

/** Represents a single field-level validation failure. */
export interface ValidationError {
  field: string;
  message: string;
}

// ─── Valorant domain types ───────────────────────────────────────────────────

export type PremierDivision =
  | 'Open'
  | 'Intermediate'
  | 'Advanced'
  | 'Elite'
  | 'Contender'
  | 'Invite'
  | 'EsportsOrg';  // Tier-2/3, VCL, Challengers, Collegiate & contracted orgs

export type ApplicationStatus =
  | 'Applied'
  | 'Reviewed'
  | 'Trialing'
  | 'Accepted'
  | 'Rejected';

// Recruiter-facing role gaps on a team roster
export type ValorantRole =
  | 'Duelist'
  | 'Initiator'
  | 'Controller'
  | 'Sentinel'
  | 'Flex';

// Tactical playstyle tags — strictly competitive roles (max 2 per player)
export type PlaystyleTag =
  | 'IGL'      // In-Game Leader
  | 'Entry'    // Entry fragger — first through the door
  | 'Lurk'     // Independent off-angle player
  | 'Support'  // Utility enabler for teammates
  | 'Anchor';  // Last-stand site holder / retaker

// Full current Valorant agent roster (kept in types for shared validation)
export const VALORANT_AGENTS = [
  'Astra', 'Breach', 'Brimstone', 'Chamber', 'Clove', 'Cypher',
  'Deadlock', 'Fade', 'Gekko', 'Harbor', 'Iso', 'Jett', 'KAY/O',
  'Killjoy', 'Neon', 'Omen', 'Phoenix', 'Raze', 'Reyna', 'Sage',
  'Skye', 'Sova', 'Tejo', 'Viper', 'Vyse', 'Waylay', 'Yoru',
] as const;

export type ValorantAgent = typeof VALORANT_AGENTS[number];

export const PREMIER_DIVISIONS: PremierDivision[] = [
  'Open', 'Intermediate', 'Advanced', 'Elite', 'Contender', 'Invite', 'EsportsOrg',
];

export const PLAYSTYLE_TAGS: PlaystyleTag[] = [
  'IGL', 'Entry', 'Lurk', 'Support', 'Anchor',
];

// 168-hour weekly availability (0 = Mon 00:00, 167 = Sun 23:00)
export type AvailabilityHours = number[];

// ─── Scout Card types ─────────────────────────────────────────────────────────

export interface ScoutCardInput {
  division?: PremierDivision;
  mainAgents?: string[];
  flexAgent?: string | null;
  playstyleTags?: PlaystyleTag[];
  vodUrl?: string | null;
  availableHours?: number[];
  isPublished?: boolean;
}

export interface TeamInput {
  name?: string;
  division?: PremierDivision;
  recruitingRoles?: ValorantRole[];
  requiredHours?: number[];
  isActivelyRecruiting?: boolean;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginationQuery {
  page?: string;
  limit?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Phase 2.3: Player Search ─────────────────────────────────────────────────

/** Validated query-string shape for GET /api/v1/players/search */
export interface PlayerSearchQuery {
  /** Filter to an exact Premier division */
  division?: string;
  /** Comma-separated agent names — player must main at least one (`&&` GIN overlap) */
  agents?: string;
  /** Comma-separated playstyle tags — player must have at least one (`&&` GIN overlap) */
  tags?: string;
  /** If "true", only return verified players */
  verified?: string;
  /** UUID of the requesting team — enables scheduleOverlap field and required for `sort=overlap` */
  teamId?: string;
  /** "recent" (default) | "trust" | "overlap" */
  sort?: string;
  page?: string;
  limit?: string;
}

/** Public-facing shape of a single Scout Card in search results */
export interface PlayerSearchResult {
  id: string;
  discordUsername: string | null;
  discordAvatar: string | null;
  riotId: string | null;
  isVerified: boolean;
  trustScore: number | null;
  verificationTier: string | null;
  division: string | null;
  mainAgents: string[];
  flexAgent: string | null;
  playstyleTags: string[];
  vodUrl: string | null;
  availableHours: number[];
  updatedAt: Date;
  /** Only present when teamId is supplied — how many of the team's required hours this player covers */
  scheduleOverlap?: number;
}
