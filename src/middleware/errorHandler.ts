// Central error handler — must be the LAST middleware registered in app.ts.

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Creates a structured operational error with a status code.
 * Use this in service/controller layers to surface clean errors to the handler.
 */
export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

/**
 * Express error-handling middleware (4-argument signature).
 * Intercepts Prisma known errors before falling through to the generic handler.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Prisma known request errors ──────────────────────────────────────────────
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      // Unique constraint violation
      const field = Array.isArray(err.meta?.target)
        ? (err.meta!.target as string[]).join(', ')
        : 'field';
      res.status(409).json({
        success: false,
        error: `A record with this ${field} already exists.`,
      });
      return;
    }

    if (err.code === 'P2025') {
      // Record not found (e.g. update/delete on non-existent row)
      res.status(404).json({
        success: false,
        error: 'The requested record was not found.',
      });
      return;
    }

    if (err.code === 'P2023') {
      // Inconsistent column data (e.g. invalid UUID format)
      res.status(400).json({
        success: false,
        error: 'Invalid ID or query parameter format.',
      });
      return;
    }
  }

  // ── Generic handler ──────────────────────────────────────────────────────────
  const statusCode = err.statusCode ?? 500;

  // Log non-operational (programming) errors in detail
  if (!err.isOperational) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: err.message ?? 'Internal Server Error',
    ...(env.isDev && { stack: err.stack }),
  });
}
