// src/services/verification.service.ts
// Tracker.gg scraping + Trust Score calculation for Riot ID verification.
// No user friction — player just enters their Riot ID and we verify automatically.

import axios, { AxiosError } from 'axios';
import prisma from '../lib/prisma';
import { env } from '../config/env';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TrustScoreResult {
  verified: boolean;
  tier: 'verified' | 'unverified';
  badge: string;
  trustScore: number;
  breakdown: TrustBreakdown;
  trackerData: TrackerSummary | null;
  reason?: string;
}

interface TrustBreakdown {
  matchesScore: number;       // max 30
  activityScore: number;      // max 20
  rankScore: number;          // max 30
  timePlayedScore: number;    // max 20
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

// ─── Tracker.gg API ───────────────────────────────────────────────────────────

const TRACKER_BASE = 'https://public-api.tracker.gg/v2/valorant/standard/profile/riot';

interface TrackerStatValue {
  value: number;
  displayValue: string;
  percentile?: number;
  metadata?: Record<string, unknown>;
}

interface TrackerSegment {
  type: string;
  stats: {
    matchesPlayed?: TrackerStatValue;
    timePlayed?: TrackerStatValue;   // in seconds
    rank?: TrackerStatValue & { metadata?: { tierName?: string; tier?: number } };
    peakRank?: TrackerStatValue & { metadata?: { tierName?: string; tier?: number } };
    matchesWon?: TrackerStatValue;
  };
  metadata?: {
    name?: string;
    actStartDate?: string;
  };
}

interface TrackerApiResponse {
  data: {
    platformInfo: { platformUserHandle: string };
    metadata: { lastUpdated?: { value: string } };
    segments: TrackerSegment[];
  };
}

// ─── Public service functions ─────────────────────────────────────────────────

/**
 * Main verification function.
 * 1. Fetches Tracker.gg data for the given Riot ID
 * 2. Calculates trust score
 * 3. Updates the player record in the database
 * 4. Returns the full trust score result
 */
export async function verifyPlayer(
  playerId: string,
  riotId: string
): Promise<TrustScoreResult> {
  // Parse Riot ID format: "TenZ#NA1" → name="TenZ", tag="NA1"
  const { name, tag } = parseRiotId(riotId);

  // Fetch from Tracker.gg
  const trackerData = await fetchTrackerData(name, tag);

  // Calculate trust score from whatever data we got
  const { score, breakdown } = calculateTrustScore(trackerData);

  // Determine verification status (threshold: 60)
  const verified = score >= 60;
  const tier: 'verified' | 'unverified' = verified ? 'verified' : 'unverified';
  const badge = verified ? '✅ Verified' : '⚠️ Unverified';

  // Persist to database
  await prisma.player.update({
    where: { id: playerId },
    data: {
      riotId: `${name}#${tag}`,
      isVerified: verified,
      trustScore: score,
      verificationTier: tier,
      verifiedAt: new Date(),
    },
  });

  const result: TrustScoreResult = {
    verified,
    tier,
    badge,
    trustScore: score,
    breakdown,
    trackerData,
  };

  if (!verified) {
    result.reason =
      score === 0
        ? 'Could not fetch account data from Tracker.gg — check your Riot ID format (e.g. TenZ#NA1)'
        : 'New or inactive account — not enough match history to verify automatically';
  }

  return result;
}

/**
 * Returns the current verification status of a player without re-fetching Tracker.
 */
export async function getVerificationStatus(playerId: string) {
  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      riotId: true,
      isVerified: true,
      trustScore: true,
      verificationTier: true,
      verifiedAt: true,
    },
  });
  return player;
}

// ─── Tracker.gg fetcher ───────────────────────────────────────────────────────

async function fetchTrackerData(name: string, tag: string): Promise<TrackerSummary | null> {
  const encodedRiotId = encodeURIComponent(`${name}#${tag}`);
  const url = `${TRACKER_BASE}/${encodedRiotId}`;

  try {
    const response = await axios.get<TrackerApiResponse>(url, {
      headers: {
        'TRN-Api-Key': env.TRACKER_API_KEY,
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
      },
      timeout: 10_000,
    });

    const data = response.data.data;
    const overview = data.segments.find((s) => s.type === 'overview');

    if (!overview) return null;

    const stats = overview.stats;
    const matchesPlayed = stats.matchesPlayed?.value ?? 0;
    const timePlayedSeconds = stats.timePlayed?.value ?? 0;
    const hoursPlayed = Math.round(timePlayedSeconds / 3600);
    const rank = stats.rank?.metadata?.tierName ?? 'Unranked';
    const rankTier = (stats.rank?.metadata?.tier as number) ?? 0;
    const peakRank = stats.peakRank?.metadata?.tierName ?? 'Unranked';
    const matchesWon = stats.matchesWon?.value ?? 0;
    const winRate = matchesPlayed > 0 ? Math.round((matchesWon / matchesPlayed) * 100) : 0;
    const lastUpdated = (data.metadata.lastUpdated?.value as string) ?? new Date().toISOString();

    return {
      riotId: `${name}#${tag}`,
      playerName: name,
      playerTag: tag,
      rank,
      rankTier,
      peakRank,
      matchesPlayed,
      hoursPlayed,
      winRate,
      lastUpdated,
    };
  } catch (err) {
    const axiosErr = err as AxiosError;

    // 404 = player not found on Tracker
    if (axiosErr.response?.status === 404) {
      return null;
    }

    // 429 = rate limited — log but don't crash
    if (axiosErr.response?.status === 429) {
      console.warn('Tracker.gg rate limit hit. Returning null.');
      return null;
    }

    // Network error or timeout
    console.error('Tracker.gg fetch error:', axiosErr.message);
    return null;
  }
}

// ─── Trust score calculator ───────────────────────────────────────────────────

const RADIANT_TIER = 24;
const IMMORTAL_TIER = 21; // Immortal 1
const DIAMOND_TIER = 18;  // Diamond 1

function calculateTrustScore(trackerData: TrackerSummary | null): {
  score: number;
  breakdown: TrustBreakdown;
} {
  const breakdown: TrustBreakdown = {
    matchesScore: 0,
    activityScore: 0,
    rankScore: 0,
    timePlayedScore: 0,
  };

  // No data at all → score 0
  if (!trackerData) {
    return { score: 0, breakdown };
  }

  // ── Matches played (max 30) ───────────────────────────────────────────────
  if (trackerData.matchesPlayed >= 500) {
    breakdown.matchesScore = 30;
  } else if (trackerData.matchesPlayed >= 100) {
    breakdown.matchesScore = 20;
  } else if (trackerData.matchesPlayed >= 20) {
    breakdown.matchesScore = 10;
  }

  // ── Recent activity — has played ranked at all (max 20) ───────────────────
  // If the account has a rank (not 0/unranked), they played this act
  if (trackerData.rankTier > 0) {
    breakdown.activityScore = 20;
  } else if (trackerData.matchesPlayed > 0) {
    breakdown.activityScore = 10; // Unranked but has matches
  }

  // ── Rank level (max 30) ───────────────────────────────────────────────────
  if (trackerData.rankTier >= RADIANT_TIER) {
    breakdown.rankScore = 30; // Radiant
  } else if (trackerData.rankTier >= IMMORTAL_TIER) {
    breakdown.rankScore = 25; // Immortal
  } else if (trackerData.rankTier >= DIAMOND_TIER) {
    breakdown.rankScore = 20; // Diamond
  } else if (trackerData.rankTier > 0) {
    breakdown.rankScore = 10; // Any rank (Gold, Plat, etc.)
  }

  // ── Time played (max 20) ──────────────────────────────────────────────────
  if (trackerData.hoursPlayed >= 500) {
    breakdown.timePlayedScore = 20;
  } else if (trackerData.hoursPlayed >= 200) {
    breakdown.timePlayedScore = 15;
  } else if (trackerData.hoursPlayed >= 50) {
    breakdown.timePlayedScore = 10;
  } else if (trackerData.hoursPlayed >= 10) {
    breakdown.timePlayedScore = 5;
  }

  const score = Math.min(
    100,
    breakdown.matchesScore +
      breakdown.activityScore +
      breakdown.rankScore +
      breakdown.timePlayedScore
  );

  return { score, breakdown };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseRiotId(riotId: string): { name: string; tag: string } {
  // Support both "TenZ#NA1" and "TenZ NA1" formats
  const parts = riotId.includes('#') ? riotId.split('#') : riotId.split(' ');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('INVALID_RIOT_ID');
  }
  return { name: parts[0].trim(), tag: parts[1].trim() };
}
