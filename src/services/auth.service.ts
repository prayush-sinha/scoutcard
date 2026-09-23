// src/services/auth.service.ts
// Handles all Discord OAuth logic and JWT operations.

import axios from 'axios';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../lib/prisma';
import { env } from '../config/env';
import { JwtPayload } from '../types';

// ─── Discord API constants ────────────────────────────────────────────────────

const DISCORD_API_BASE = 'https://discord.com/api/v10';
const DISCORD_TOKEN_URL = `${DISCORD_API_BASE}/oauth2/token`;
const DISCORD_USER_URL = `${DISCORD_API_BASE}/users/@me`;

const DISCORD_SCOPES = ['identify', 'email'].join(' ');

// ─── State store (in-memory for dev; swap for Redis in production) ────────────
// Stores generated state strings to validate OAuth callback (CSRF protection).

const pendingStates = new Map<string, number>(); // state → expiry timestamp

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateState(): string {
  const state = crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  pendingStates.set(state, now + STATE_TTL_MS);

  // Prune expired states on every generation to prevent unbounded map growth
  // (abandoned OAuth flows where the user closed Discord before granting access).
  for (const [key, expiry] of pendingStates) {
    if (now > expiry) pendingStates.delete(key);
  }

  return state;
}

function validateState(state: string): boolean {
  const expiry = pendingStates.get(state);
  if (!expiry) return false;
  pendingStates.delete(state);
  return Date.now() < expiry;
}

// ─── Discord interfaces ───────────────────────────────────────────────────────

interface DiscordTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
  global_name?: string | null;
}

// ─── Public service methods ───────────────────────────────────────────────────

/**
 * Builds the Discord OAuth2 authorization URL with a fresh CSRF state token.
 */
export function getDiscordAuthUrl(): { url: string; state: string } {
  const state = generateState();

  const params = new URLSearchParams({
    client_id: env.DISCORD_CLIENT_ID,
    redirect_uri: env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: DISCORD_SCOPES,
    state,
    prompt: 'none', // skip consent screen if already authorized
  });

  return {
    url: `${DISCORD_API_BASE}/oauth2/authorize?${params.toString()}`,
    state,
  };
}

/**
 * Handles the OAuth2 callback:
 * 1. Validates state (CSRF check)
 * 2. Exchanges code for Discord access token
 * 3. Fetches Discord user profile
 * 4. Upserts player in database
 * 5. Returns signed JWT
 */
export async function handleDiscordCallback(
  code: string,
  state: string
): Promise<{ token: string; isNewUser: boolean }> {
  // CSRF validation
  if (!validateState(state)) {
    throw new Error('INVALID_STATE');
  }

  // Exchange code for Discord tokens
  const discordTokens = await exchangeCodeForTokens(code);

  // Fetch Discord user profile
  const discordUser = await fetchDiscordUser(discordTokens.access_token);

  // Upsert player in the database
  const { player, isNewUser } = await upsertPlayer(discordUser, discordTokens.access_token);

  // Sign and return our own JWT
  const token = signJwt({ userId: player.id, discordId: player.discordId });

  return { token, isNewUser };
}

/**
 * Returns the player associated with a verified JWT payload.
 * Returns all fields needed by the frontend auth context (including verification status).
 */
export async function getPlayerFromJwt(userId: string) {
  const player = await prisma.player.findUnique({
    where: { id: userId },
    select: {
      id: true,
      discordId: true,
      discordUsername: true,
      discordAvatar: true,
      riotId: true,
      isVerified: true,
      trustScore: true,         // included so frontend can show the trust badge
      verificationTier: true,   // included so frontend can conditionally render verified/unverified state
      division: true,
      mainAgents: true,
      flexAgent: true,
      playstyleTags: true,
      vodUrl: true,
      availableHours: true,
      isPublished: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return player;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function exchangeCodeForTokens(code: string): Promise<DiscordTokenResponse> {
  try {
    const body = new URLSearchParams({
      client_id: env.DISCORD_CLIENT_ID,
      client_secret: env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: env.DISCORD_REDIRECT_URI,
    });

    const response = await axios.post<DiscordTokenResponse>(DISCORD_TOKEN_URL, body.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    return response.data;
  } catch (_err) {
    throw new Error('DISCORD_TOKEN_EXCHANGE_FAILED');
  }
}

async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  try {
    const response = await axios.get<DiscordUser>(DISCORD_USER_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data;
  } catch (_err) {
    throw new Error('DISCORD_USER_FETCH_FAILED');
  }
}

async function upsertPlayer(
  discordUser: DiscordUser,
  discordToken: string
): Promise<{ player: { id: string; discordId: string }; isNewUser: boolean }> {
  // NOTE: discordToken is stored as plain text. The schema comment says "encrypted"
  // but encryption is deferred to a later hardening phase. The token has a short
  // TTL (~7 days) and is used only to refresh profile data on login. Do NOT store
  // long-lived credentials here without encrypting first.
  const existing = await prisma.player.findUnique({
    where: { discordId: discordUser.id },
  });

  const displayName = discordUser.global_name ?? discordUser.username;

  const avatarUrl = discordUser.avatar
    ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.webp?size=256`
    : null;

  if (existing) {
    // Update token and profile on every login
    const updated = await prisma.player.update({
      where: { id: existing.id },
      data: {
        discordToken,
        discordUsername: displayName,
        discordAvatar: avatarUrl,
      },
      select: { id: true, discordId: true },
    });
    return { player: updated, isNewUser: false };
  }

  // First-time login — create player record
  const created = await prisma.player.create({
    data: {
      discordId: discordUser.id,
      discordToken,
      discordUsername: displayName,
      discordAvatar: avatarUrl,
    },
    select: { id: true, discordId: true },
  });

  return { player: created, isNewUser: true };
}

function signJwt(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}
