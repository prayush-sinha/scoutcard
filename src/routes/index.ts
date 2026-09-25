// src/routes/index.ts
// Central router — mounts all sub-routers under their base paths.

import { Router } from 'express';
import authRoutes from './auth';
import verificationRoutes from './verification';
import playerRoutes from './players';
import teamRoutes from './teams';
import applicationRoutes from './applications';


const router = Router();

// ── Health-check (unauthenticated) ────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ── Phase 1.2: Authentication ─────────────────────────────────────────────────
router.use('/auth', authRoutes);

// ── Phase 1.3: Verification ───────────────────────────────────────────────────
router.use('/verification', verificationRoutes);

// ── Phase 2.1: Scout Card / Player Onboarding ─────────────────────────────────
router.use('/players', playerRoutes);

// ── Phase 2.2: Team Dashboard & Creation ──────────────────────────────────────
router.use('/teams', teamRoutes);

// ── Phase 3.1: Application System ─────────────────────────────────────────────
router.use('/applications', applicationRoutes);

// ── Future routes (uncommented as each phase is built) ────────────────────────
// import notificationRoutes from './notifications';  // Phase 3.3

// router.use('/notifications', notificationRoutes);

export default router;
