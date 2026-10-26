import { Response } from 'express';
import { isDatabaseUnavailable, logDatabaseError } from './index.js';

export function databaseFailure(res: Response, context: string, error: unknown, message: string): void {
  logDatabaseError(context, error);
  res.status(isDatabaseUnavailable(error) ? 503 : 500).json({
    success: false,
    message: isDatabaseUnavailable(error) ? 'The database is unavailable. Please try again shortly.' : message
  });
}

export function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && String(error.code) === 'P2002';
}
