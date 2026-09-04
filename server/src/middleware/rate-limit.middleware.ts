import type { Request, Response, NextFunction } from 'express';
import { tooManyRequests } from '../lib/errors';

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const sweep = () => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
};

export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

export const rateLimit = (options: RateLimitOptions) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (buckets.size > 10_000) sweep();
    const key = `${req.ip ?? 'unknown'}:${req.baseUrl || req.path}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt < now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    bucket.count += 1;
    if (bucket.count > options.max) {
      next(tooManyRequests(options.message));
      return;
    }
    next();
  };
};

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many login attempts. Try again in 15 minutes.',
});

export const contactRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many messages submitted. Please try again later.',
});

export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
});
