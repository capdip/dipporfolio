import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { isProduction } from '../config/env.js';

interface ErrorBody {
  error: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.path}`, code: 'not_found' } });
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation failed',
        code: 'validation_error',
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
    return;
  }

  logger.error('Unhandled error', {
    path: req.path,
    method: req.method,
    error: String((err as Error)?.stack || err),
  });

  const body: ErrorBody = {
    error: {
      message: isProduction() ? 'Internal server error' : String((err as Error)?.message || err),
      code: 'internal_error',
    },
  };
  res.status(500).json(body);
};
