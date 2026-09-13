import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // 1. Handled AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(err.details ? { details: err.details } : {}),
      },
    });
    return;
  }

  // 2. Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.flatten(),
      },
    });
    return;
  }

  // 3. PostgreSQL Database errors
  const pgErr = err as { code?: string; detail?: string; table?: string; constraint?: string; message?: string };
  if (pgErr && typeof pgErr.code === 'string') {
    // Unique violation
    if (pgErr.code === '23505') {
      res.status(409).json({
        success: false,
        error: {
          code: 'CONFLICT',
          message: pgErr.detail || 'A resource with this identifier already exists',
        },
      });
      return;
    }

    // Foreign key violation
    if (pgErr.code === '23503') {
      res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: pgErr.detail || 'Referenced record does not exist',
        },
      });
      return;
    }

    // Not null violation
    if (pgErr.code === '23502') {
      res.status(400).json({
        success: false,
        error: {
          code: 'NOT_NULL_VIOLATION',
          message: `Missing required field on ${pgErr.table || 'record'}`,
        },
      });
      return;
    }
  }

  // 4. Fallback unknown internal error
  const standardErr = err instanceof Error ? err : new Error(String(err));
  console.error('💥 Unhandled Error:', standardErr);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : standardErr.message,
      ...(env.NODE_ENV !== 'production' ? { stack: standardErr.stack } : {}),
    },
  });
}
