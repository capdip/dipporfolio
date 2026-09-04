import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.middleware.js';
import { getEnv } from '../config/env.js';

const router = Router();

type LogDoc = Record<string, unknown>;

const wrap =
  (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (error) {
      next(error);
    }
  };

router.get(
  '/',
  authenticate,
  requireAdmin,
  wrap(async (req, res) => {
    const filter: Record<string, unknown> = {};
    if (typeof req.query.resource === 'string' && req.query.resource !== 'all') {
      filter.resource = req.query.resource;
    }
    if (typeof req.query.action === 'string' && req.query.action !== 'all') {
      filter.action = req.query.action;
    }
    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const logs = await getDb()
      .collection('audit_logs')
      .find(filter, { sort: { createdAt: -1 as const } })
      .limit(limit)
      .toArray();
    res.json({ success: true, data: logs });
  })
);

export default router;
