import type { Request } from 'express';
import { getDb } from '../db/database.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';
import { getEnv } from '../config/env.js';

export interface AuditContext {
  req: Request;
  action: string;
  resource: string;
  resourceId?: string;
  detail?: Record<string, unknown>;
}

export const recordAudit = async (ctx: AuditContext): Promise<void> => {
  try {
    const db = getDb();
    const collection = db.collection('audit_logs');
    const auth = ctx.req as AuthRequest;
    await collection.insertOne({
      actorEmail: auth.user?.email ?? 'anonymous',
      action: ctx.action,
      resource: ctx.resource,
      resourceId: ctx.resourceId,
      detail: ctx.detail ?? {},
      ip: ctx.req.ip,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch {
    // Audit logging must never break request flow; failures are swallowed.
  }
};

export const ensureAdminUser = async (): Promise<{ email: string; created: boolean }> => {
  const env = getEnv();
  const { hashPassword } = await import('../lib/password.js');
  const db = getDb();
  const users = db.collection('users');
  const existing = await users.findOne({ email: env.ADMIN_EMAIL });
  if (existing) return { email: env.ADMIN_EMAIL, created: false };
  await users.insertOne({
    email: env.ADMIN_EMAIL,
    name: env.ADMIN_NAME,
    role: 'admin',
    passwordHash: await hashPassword(env.ADMIN_PASSWORD),
    tokenVersion: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  return { email: env.ADMIN_EMAIL, created: true };
};
