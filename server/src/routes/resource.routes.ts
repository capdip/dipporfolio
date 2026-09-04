import { Router, type Request, type Response, type NextFunction } from 'express';
import { authenticate, requireStaff, type AuthRequest } from '../middleware/auth.middleware';
import { recordAudit } from '../services/audit.service';
import {
  createRecord,
  deleteRecord,
  getRecordById,
  listAllRecords,
  listRecords,
  patchRecord,
  reorderRecords,
  updateRecord,
  type ResourceConfig,
} from '../services/collection.service';
import { badRequest } from '../lib/errors';

/**
 * Builds a complete REST router for a content resource:
 * - Public: GET / and GET /:id (visibility filtered)
 * - Admin/editor (JWT): full CRUD + PATCH visibility toggle + POST /reorder
 */
export const createResourceRouter = (config: ResourceConfig): Router => {
  const router = Router();

  const wrap =
    (fn: (req: AuthRequest, res: Response) => Promise<unknown>) =>
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        await fn(req as AuthRequest, res);
      } catch (error) {
        next(error);
      }
    };

  // ---------------- Public reads ----------------

  router.get(
    '/',
    wrap(async (req, res) => {
      const records = await listRecords(config, req.query as Record<string, unknown>);
      res.json({ success: true, data: records });
    })
  );

  router.get(
    '/all',
    authenticate,
    requireStaff,
    wrap(async (_req, res) => {
      const records = await listAllRecords(config);
      res.json({ success: true, data: records });
    })
  );

  router.get(
    '/:id',
    wrap(async (req, res) => {
      const record = await getRecordById(config, String(req.params.id));
      res.json({ success: true, data: record });
    })
  );

  // ---------------- Admin writes ----------------

  router.post(
    '/',
    authenticate,
    requireStaff,
    wrap(async (req, res) => {
      const record = await createRecord(config, req.body);
      await recordAudit({
        req,
        action: 'create',
        resource: config.name,
        resourceId: String(record._id),
        detail: { title: (record as Record<string, unknown>).title ?? undefined },
      });
      res.status(201).json({ success: true, data: record });
    })
  );

  router.put(
    '/:id',
    authenticate,
    requireStaff,
    wrap(async (req, res) => {
      const record = await updateRecord(config, String(req.params.id), req.body);
      await recordAudit({ req, action: 'update', resource: config.name, resourceId: String(req.params.id) });
      res.json({ success: true, data: record });
    })
  );

  router.patch(
    '/:id',
    authenticate,
    requireStaff,
    wrap(async (req, res) => {
      if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
        throw badRequest('PATCH expects a JSON object');
      }
      const record = await patchRecord(config, String(req.params.id), req.body);
      if (!record) throw badRequest('Nothing to patch or record missing');
      await recordAudit({ req, action: 'patch', resource: config.name, resourceId: String(req.params.id), detail: req.body });
      res.json({ success: true, data: record });
    })
  );

  router.delete(
    '/:id',
    authenticate,
    requireStaff,
    wrap(async (req, res) => {
      await deleteRecord(config, String(req.params.id));
      await recordAudit({ req, action: 'delete', resource: config.name, resourceId: String(req.params.id) });
      res.json({ success: true, message: 'Deleted' });
    })
  );

  router.post(
    '/reorder',
    authenticate,
    requireStaff,
    wrap(async (req, res) => {
      const ids = req.body?.ids;
      if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== 'string')) {
        throw badRequest('Body must be { ids: string[] }');
      }
      const count = await reorderRecords(config, ids);
      await recordAudit({ req, action: 'reorder', resource: config.name, detail: { count } });
      res.json({ success: true, data: { updated: count } });
    })
  );

  return router;
};
