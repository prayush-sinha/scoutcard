// src/middleware/errorHandler.ts
// Central error handler — must be the LAST middleware registered in app.ts.

import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Creates a structured operational error with a status code.
 */
export function createError(message: string, statusCode = 500): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.isOperational = true;
  return err;
}

/**
 * Express error-handling middleware (4-argument signature).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
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
