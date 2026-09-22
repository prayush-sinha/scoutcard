// src/routes/index.ts
// Central router — mounts all sub-routers under their base paths.

import { Router } from 'express';
import authRoutes from './auth';
import verificationRoutes from './verification';

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

// ── Future routes (uncommented as each phase is built) ────────────────────────
// import verificationRoutes from './verification';   // Phase 1.3
// import playerRoutes from './players';              // Phase 2.1
// import teamRoutes from './teams';                  // Phase 2.2
// import applicationRoutes from './applications';    // Phase 3.1
// import notificationRoutes from './notifications';  // Phase 3.3

// router.use('/verification', verificationRoutes);
// router.use('/players', playerRoutes);
// router.use('/teams', teamRoutes);
// router.use('/applications', applicationRoutes);
// router.use('/notifications', notificationRoutes);

export default router;
