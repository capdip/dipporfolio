import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database';
import { getEnv } from '../config/env';
import { authenticate, requireStaff, type AuthRequest } from '../middleware/auth.middleware';
import { badRequest, notFound } from '../lib/errors';
import { cvFileSchema } from '../validation/schemas';
import { recordAudit } from '../services/audit.service';

const router = Router();

const uploadDirAbsolute = () => {
  const env = (() => {
    try {
      return getEnv();
    } catch {
      return { UPLOAD_DIR: 'uploads', MAX_UPLOAD_MB: 25 };
    }
  })();
  const dir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirAbsolute()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `cv-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('CV uploads must be PDF files'));
      return;
    }
    cb(null, true);
  },
});

type CvDoc = Record<string, unknown> & { _id: string; filename?: string };

router.get(
  '/',
  authenticate,
  requireStaff,
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const docs = await getDb()
        .collection('cv_files')
        .find({}, { sort: { createdAt: -1 as const } })
        .toArray();
      res.json({ success: true, data: docs ?? [] });
    } catch (error) {
      next(error);
    }
  }
);

/** Public metadata of the active CV (no auth). */
router.get(
  '/active',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const doc = (await getDb()
        .collection('cv_files')
        .findOne({ active: true })) as CvDoc | null;
      if (!doc || doc.isPublic === false) {
        res.json({ success: true, data: null });
        return;
      }
      res.json({
        success: true,
        data: {
          _id: doc._id,
          label: doc.label,
          originalName: doc.originalName,
          size: doc.size,
          updatedAt: doc.updatedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

/** Public download of the active public CV. */
router.get(
  '/download',
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const doc = (await getDb().collection('cv_files').findOne({ active: true })) as CvDoc | null;
      if (!doc || !doc.isPublic || !doc.filename) throw notFound('No public CV available');
      const absolute = path.join(uploadDirAbsolute(), String(doc.filename));
      if (!fs.existsSync(absolute)) throw notFound('CV file missing on disk');
      res.download(absolute, String(doc.originalName ?? 'CV.pdf'));
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/',
  authenticate,
  requireStaff,
  upload.single('file'),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw badRequest('No file uploaded (field name must be "file")');
      const meta = cvFileSchema.parse(req.body.metadata ? JSON.parse(req.body.metadata) : {});
      if (meta.isPublic === undefined) meta.isPublic = true;
      const makeActive = req.body.activate !== 'false';

      if (makeActive) {
        await getDb().collection('cv_files').updateMany({}, { $set: { active: false } });
      }
      const now = new Date().toISOString();
      const doc = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        label: meta.label,
        isPublic: meta.isPublic ?? true,
        notes: meta.notes,
        size: req.file.size,
        mimeType: 'application/pdf',
        active: makeActive,
        createdAt: now,
        updatedAt: now,
      };
      const result = await getDb().collection('cv_files').insertOne(doc);
      await recordAudit({ req, action: 'upload_cv', resource: 'cv_files', resourceId: String(result.insertedId) });
      res.status(201).json({ success: true, data: { ...doc, _id: result.insertedId } });
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
      const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
      if (typeof req.body.label === 'string') set.label = req.body.label;
      if (typeof req.body.isPublic === 'boolean') set.isPublic = req.body.isPublic;
      if (typeof req.body.notes === 'string') set.notes = req.body.notes;
      if (req.body.active === true) {
        await getDb().collection('cv_files').updateMany({}, { $set: { active: false } });
        set.active = true;
      } else if (req.body.active === false) {
        set.active = false;
      }
      const result = await getDb()
        .collection('cv_files')
        .findOneAndUpdate({ _id: String(req.params.id) }, { $set: set }, { returnDocument: 'after' });
      if (!result) throw notFound('CV version not found');
      await recordAudit({ req, action: 'update_cv', resource: 'cv_files', resourceId: String(req.params.id) });
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
      const doc = (await getDb().collection('cv_files').findOne({ _id: String(req.params.id) })) as CvDoc | null;
      if (!doc) throw notFound('CV version not found');
      if (doc.filename) {
        const absolute = path.join(uploadDirAbsolute(), String(doc.filename));
        if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
      }
      await getDb().collection('cv_files').deleteOne({ _id: doc._id });
      await recordAudit({ req, action: 'delete_cv', resource: 'cv_files', resourceId: String(req.params.id) });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
