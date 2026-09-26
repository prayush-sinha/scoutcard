// Domain types — verified line-by-line against the real backend:
// https://github.com/prayush-sinha/scoutcard (prisma/schema.prisma, src/types/index.ts,
// src/services/*.ts). Where the two source docs disagreed with the actual code,
// the code wins — see README.md for the specific corrections.

export type PremierDivision =
  | "Open"
  | "Intermediate"
  | "Advanced"
  | "Elite"
  | "Contender"
  | "Invite"
  | "EsportsOrg";

export type ApplicationStatus =
  | "Applied"
  | "Reviewed"
  | "Trialing"
  | "Accepted"
  | "Rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Applied",
  "Reviewed",
  "Trialing",
  "Accepted",
  "Rejected",
];

/** A player's tactical playstyle — max 2 per Scout Card. Filters /players/search's `tags` param. */
export type PlaystyleTag = "IGL" | "Entry" | "Lurk" | "Support" | "Anchor";

/** A team's roster role gaps — a DIFFERENT taxonomy from PlaystyleTag. Only used on Team.recruitingRoles. */
export type ValorantRole = "Duelist" | "Initiator" | "Controller" | "Sentinel" | "Flex";

/** Trust score tier used for badge coloring. Green 80+, Yellow 50-79, Red <50. */
export type TrustTier = "high" | "medium" | "low";

export function trustTier(score: number): TrustTier {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

/** GET /auth/me — note the field is `id`, not `userId` (that's the JWT payload's key, not the API response's). */
export interface AuthenticatedPlayer {
  id: string;
  discordId: string;
  discordUsername: string | null;
  discordAvatar: string | null;
  riotId: string | null;
  isVerified: boolean;
  trustScore: number | null;
  verificationTier: string | null;
  division: PremierDivision | null;
  mainAgents: string[];
  flexAgent: string | null;
  playstyleTags: PlaystyleTag[];
  vodUrl: string | null;
  availableHours: number[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScoutCard {
  id: string;
  riotId: string;
  discordUsername: string;
  discordAvatar: string;
  isVerified: boolean;
  trustScore: number;
  division: PremierDivision;
  mainAgents: string[]; // exactly 2 to publish
  flexAgent: string | null;
  playstyleTags: PlaystyleTag[]; // 1-2 to publish
  vodUrl: string | null;
  availableHours: number[]; // 0-167, 0 = Monday 00:00 UTC
  isPublished: boolean;
  scheduleOverlap?: number; // raw hour count — from server when teamId supplied, or computed client-side against a filter block
  scheduleOverlapTotal?: number; // denominator, only set for the client-side filter-block scratchpad (see FilterSidebar)
}

export interface ScoutCardPayload {
  division?: PremierDivision;
  mainAgents?: string[];
  flexAgent?: string | null;
  playstyleTags?: PlaystyleTag[];
  vodUrl?: string | null;
  availableHours?: number[];
  isPublished?: boolean;
}

/** Tracker.gg-backed result from POST /verification/verify-riot. */
export interface TrustBreakdown {
  matchesScore: number; // max 30
  activityScore: number; // max 20
  rankScore: number; // max 30
  timePlayedScore: number; // max 20
}

export interface TrackerSummary {
  riotId: string;
  playerName: string;
  playerTag: string;
  rank: string;
  rankTier: number;
  peakRank: string;
  matchesPlayed: number;
  hoursPlayed: number;
  winRate: number;
  lastUpdated: string;
}

export interface TrustScoreResult {
  verified: boolean;
  tier: "verified" | "unverified";
  badge: string;
  trustScore: number;
  breakdown: TrustBreakdown;
  trackerData: TrackerSummary | null;
  reason?: string;
}

export interface VerificationStatus {
  riotId: string | null;
  isVerified: boolean;
  trustScore: number | null;
  verificationTier: string | null;
  verifiedAt: string | null;
}

export interface TeamRosterMember {
  id: string;
  discordUsername: string;
  discordAvatar: string;
  riotId: string;
  isVerified: boolean;
  trustScore: number;
  division: PremierDivision;
  mainAgents: string[];
  playstyleTags: PlaystyleTag[];
}

export interface ApplicationStats {
  total: number;
  applied: number;
  reviewed: number;
  trialing: number;
  accepted: number;
  rejected: number;
}

export interface Team {
  id: string;
  name: string;
  captainId: string;
  division: PremierDivision | null;
  recruitingRoles: ValorantRole[];
  requiredHours: number[];
  isActivelyRecruiting: boolean;
  roster?: TeamRosterMember[];
  applicationStats?: ApplicationStats; // only present on GET /teams/my-team
}

export interface TeamPayload {
  name?: string;
  division?: PremierDivision;
  recruitingRoles?: ValorantRole[];
  requiredHours?: number[];
  isActivelyRecruiting?: boolean;
}

/** Applicant summary embedded in a captain's team application list — NOT the full Scout Card (no flexAgent). */
export interface ApplicantSummary {
  riotId: string;
  discordUsername: string;
  discordAvatar: string;
  isVerified: boolean;
  trustScore: number;
  division: PremierDivision;
  mainAgents: string[];
  playstyleTags: PlaystyleTag[];
}

export interface Application {
  id: string;
  playerId: string;
  teamId: string;
  status: ApplicationStatus;
  message: string | null;
  captainNotes: string | null;
  createdAt: string;
  updatedAt: string;
  // Present on the captain's team-application list:
  player?: ApplicantSummary;
  // Present on the player's own my-applications list:
  team?: Pick<Team, "id" | "name" | "division" | "recruitingRoles">;
}

export interface ApplicationHistoryEntry {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  changedBy: string | null;
  note: string | null;
  changedAt: string;
}

/** Socket.io `notification:new` payload — the only notification shape wired up so far (see README). */
export interface LiveNotification {
  type: string;
  applicationId: string;
  message: string;
}

export interface PlayerSearchFilters {
  division?: PremierDivision;
  agents?: string[];
  tags?: PlaystyleTag[];
  verified?: boolean;
  teamId?: string;
  sort?: "recent" | "trust" | "overlap";
  page?: number;
  limit?: number;
}
