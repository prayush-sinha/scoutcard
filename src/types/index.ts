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

// ─── Valorant domain types ───────────────────────────────────────────────────

export type PremierDivision =
  | 'Open'
  | 'Intermediate'
  | 'Advanced'
  | 'Elite'
  | 'Contender'
  | 'Invite';

export type ApplicationStatus =
  | 'Applied'
  | 'Reviewed'
  | 'Trialing'
  | 'Accepted'
  | 'Rejected';

export type ValorantRole =
  | 'Duelist'
  | 'Initiator'
  | 'Controller'
  | 'Sentinel'
  | 'Flex';

export type PlaystyleTag =
  | 'Aggressive'
  | 'Defensive'
  | 'Supportive'
  | 'Entry'
  | 'Anchor'
  | 'Lurker';

// 168-hour weekly availability (0 = Mon 00:00, 167 = Sun 23:00)
export type AvailabilityHours = number[];

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
