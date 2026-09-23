// src/lib/prisma.ts
// Singleton Prisma client. Reusing a single instance avoids
// exhausting the database connection pool in development (hot-reload).

import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isTest = process.env.NODE_ENV === 'test';

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: isTest ? [] : env.isDev ? ['query', 'warn', 'error'] : ['error'],
  });

if (env.isDev) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
