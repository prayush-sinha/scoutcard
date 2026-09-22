// src/middleware/rateLimiter.ts
// Configures express-rate-limit for global and sensitive-route protection.

import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Global rate limiter — applied to all routes.
 * Default: 100 requests per 15 minutes.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
});

/**
 * Stricter limiter for auth endpoints (prevents brute-force).
 * 10 attempts per 15 minutes.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later.',
  },
});

/**
 * Strict limiter for verification PIN checks (Tracker API protection).
 * 5 attempts per 5 minutes.
 */
export const verifyRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many verification attempts, please wait before retrying.',
  },
});
