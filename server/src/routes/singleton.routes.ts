import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database';
import { authenticate } from '../middleware/auth.middleware';
import { recordAudit } from '../services/audit.service';
import type { AuthRequest } from '../middleware/auth.middleware';

/**
 * Singleton content endpoints (hero / about): one active document per collection.
 * Public GET returns the active document; admin PUT upserts it.
 */
export const createSingletonRouter = (
  collectionName: string,
  parseBody: (body: unknown) => Record<string, unknown>
): Router => {
  const router = Router();

  const wrap =
    (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
    async (req: AuthRequest, res: Response, next: NextFunction) => {
      try {
        await fn(req, res);
      } catch (error) {
        next(error);
      }
    };

  const getActive = async (): Promise<Record<string, unknown> | null> => {
    const doc = (await getDb()
      .collection(collectionName)
      .findOne({ isActive: true })) as Record<string, unknown> | null;
    if (doc) return doc;
    // Fall back to the first document if none is flagged active.
    return (await getDb().collection(collectionName).findOne({})) as Record<string, unknown> | null;
  };

  router.get(
    '/',
    wrap(async (_req, res) => {
      const doc = await getActive();
      res.json({ success: true, data: doc ?? null });
    })
  );

  router.put(
    '/',
    authenticate,
    wrap(async (req, res) => {
      const data = parseBody(req.body);
      delete data._id;
      delete data.createdAt;
      const now = new Date().toISOString();
      const existing = await getDb().collection(collectionName).findOne({});
      let saved: unknown;
      if (existing) {
        saved = (
          await getDb()
            .collection(collectionName)
            .findOneAndUpdate(
              { _id: existing._id },
              { $set: { ...data, isActive: true, updatedAt: now } },
              { returnDocument: 'after' }
            )
          );
      } else {
        await getDb()
          .collection(collectionName)
          .insertOne({ ...data, isActive: true, createdAt: now, updatedAt: now });
        saved = await getActive();
      }
      await recordAudit({ req, action: 'update', resource: collectionName });
      res.json({ success: true, data: saved });
    })
  );

  return router;
};
