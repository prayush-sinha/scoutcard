// src/server.ts
// Entry point — connects to the database then starts the HTTP server.
// Socket.io will be attached here in Phase 3.3.

import { createServer } from 'http';
import { createApp } from './app';
import prisma from './lib/prisma';
import { env } from './config/env';
import { initSocket } from './socket';

async function main(): Promise<void> {
  // ── 1. Test database connection ─────────────────────────────────────────────
  try {
    await prisma.$connect();
    console.log('✅  Database connected successfully');
  } catch (err) {
    console.error('❌  Failed to connect to database:', err);
    process.exit(1);
  }

  // ── 2. Create Express app ───────────────────────────────────────────────────
  const app = createApp();

  // ── 3. Start HTTP server + Socket.io ───────────────────────────────────────
  const httpServer = createServer(app);
  initSocket(httpServer);

  const server = httpServer.listen(env.PORT, () => {
    console.log(`🚀  Server + Socket.io running on port ${env.PORT}  [${env.NODE_ENV}]`);
    console.log(`📡  API base: http://localhost:${env.PORT}/api/v1`);
  });

  // ── 4. Graceful shutdown ────────────────────────────────────────────────────
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n⚠️   ${signal} received — shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅  Database disconnected. Bye!');
      process.exit(0);
    });

    // Force kill after 10 s if something is hanging
    setTimeout(() => {
      console.error('❌  Forceful shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
