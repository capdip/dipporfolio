import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, requireStaff } from '../middleware/auth.middleware.js';
import { contactRateLimiter } from '../middleware/rate-limit.middleware.js';
import { contactSubmissionSchema, contactMessageAdminSchema } from '../validation/schemas.js';
import { badRequest, notFound } from '../lib/errors.js';
import type { AuthRequest } from '../middleware/auth.middleware.js';

const router = Router();

type MessageDoc = Record<string, unknown> & { _id: string };

router.post(
  '/',
  contactRateLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const data = contactSubmissionSchema.parse(req.body);
      // Honeypot: silently accept but discard so bots think they succeeded.
      if (data.honeypot) {
        res.json({ success: true, message: 'Message received' });
        return;
      }
      delete (data as { honeypot?: string }).honeypot;
      const now = new Date().toISOString();
      await getDb().collection('contact_messages').insertOne({
        ...data,
        status: 'unread',
        createdAt: now,
        updatedAt: now,
      });
      res.status(201).json({ success: true, message: 'Thank you — your message has been received.' });
    } catch (error) {
      next(error);
    }
  }
);

// ---------------- Admin inbox ----------------

router.get(
  '/',
  authenticate,
  requireStaff,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filter: Record<string, unknown> = {};
      const status = req.query.status;
      if (typeof status === 'string' && status !== 'all') filter.status = status;
      if (typeof req.query.search === 'string' && req.query.search.trim()) {
        const rx = { $regex: req.query.search.trim(), $options: 'i' };
        filter.$or = [{ name: rx }, { email: rx }, { subject: rx }, { message: rx }];
      }
      const messages = await getDb()
        .collection('contact_messages')
        .find(filter, { sort: { createdAt: -1 as const } })
        .limit(500)
        .toArray();
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  }
);

router.patch(
  '/:id',
  authenticate,
  requireStaff,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const input = contactMessageAdminSchema.parse(req.body);
      const result = await getDb()
        .collection('contact_messages')
        .findOneAndUpdate(
          { _id: req.params.id },
          { $set: { ...input, updatedAt: new Date().toISOString() } },
          { returnDocument: 'after' }
        );
      if (!result) throw notFound('Message not found');
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requireStaff,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.params.id || req.params.id.length < 6) throw badRequest('Invalid id');
      await getDb().collection('contact_messages').deleteOne({ _id: req.params.id });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
