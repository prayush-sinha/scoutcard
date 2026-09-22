// src/app.ts
// Express application factory.
// Keeps app creation separate from server start so it can be reused in tests.

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import { globalRateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import apiRouter from './routes/index';

export function createApp(): Application {
  const app = express();

  // ── Security headers ────────────────────────────────────────────────────────
  app.use(helmet());

  // ── CORS ────────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,           // allows cookies / auth headers
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // ── Body parsing ────────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // ── HTTP logging ────────────────────────────────────────────────────────────
  app.use(morgan(env.isDev ? 'dev' : 'combined'));

  // ── Global rate limiting ────────────────────────────────────────────────────
  app.use(globalRateLimiter);

  // ── API routes ──────────────────────────────────────────────────────────────
  app.use('/api/v1', apiRouter);

  // ── 404 handler (must come before error handler) ────────────────────────────
  app.use(notFound);

  // ── Centralised error handler (must be last) ─────────────────────────────────
  app.use(errorHandler);

  return app;
}
