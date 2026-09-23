// src/config/env.ts
// Validates and exports all environment variables at startup.
// The app will fail fast (throw) if any required variable is missing.

import dotenv from 'dotenv';
dotenv.config();

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  // Server
  NODE_ENV: optionalEnv('NODE_ENV', 'development'),
  PORT: parseInt(optionalEnv('PORT', '3001'), 10),

  // Database
  DATABASE_URL: requireEnv('DATABASE_URL'),

  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_EXPIRES_IN: optionalEnv('JWT_EXPIRES_IN', '7d'),

  // Discord OAuth
  DISCORD_CLIENT_ID: optionalEnv('DISCORD_CLIENT_ID', ''),
  DISCORD_CLIENT_SECRET: optionalEnv('DISCORD_CLIENT_SECRET', ''),
  DISCORD_REDIRECT_URI: optionalEnv(
    'DISCORD_REDIRECT_URI',
    'http://localhost:3001/api/v1/auth/discord/callback'
  ),

  // Tracker.gg
  TRACKER_API_KEY: optionalEnv('TRACKER_API_KEY', ''),
  TRACKER_BASE_URL: optionalEnv(
    'TRACKER_BASE_URL',
    'https://public-api.tracker.gg/v2/valorant'
  ),

  // CORS
  CLIENT_URL: optionalEnv('CLIENT_URL', 'http://localhost:5173'),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: parseInt(optionalEnv('RATE_LIMIT_WINDOW_MS', '900000'), 10),
  RATE_LIMIT_MAX: parseInt(optionalEnv('RATE_LIMIT_MAX', '100'), 10),

  // Helpers
  get isDev() {
    return this.NODE_ENV === 'development';
  },
  get isProd() {
    return this.NODE_ENV === 'production';
  },
} as const;
