import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env';
import { unauthorized, forbidden } from '../lib/errors';

export interface AuthUser {
  userId: string;
  email: string;
  role: 'admin' | 'editor';
  tokenVersion?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const signToken = (user: AuthUser): string => {
  const env = getEnv();
  return jwt.sign(
    { userId: user.userId, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions
  );
};

const extractToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  return null;
};

export const authenticate = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  const token = extractToken(req);
  if (!token) return next(unauthorized('Access token required'));
  try {
    const decoded = jwt.verify(token, getEnv().JWT_SECRET) as AuthUser;
    req.user = decoded;
    next();
  } catch {
    next(unauthorized('Invalid or expired token'));
  }
};

export const requireAdmin = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin') return next(forbidden('Admin role required'));
  next();
};

export const requireStaff = (req: AuthRequest, _res: Response, next: NextFunction): void => {
  if (!req.user) return next(unauthorized());
  if (req.user.role !== 'admin' && req.user.role !== 'editor') {
    return next(forbidden('Editor or admin role required'));
  }
  next();
};
