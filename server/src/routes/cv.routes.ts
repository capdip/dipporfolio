import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { getEnv } from '../config/env.js';
import { authenticate, requireStaff, type AuthRequest } from '../middleware/auth.middleware.js';
import { badRequest, notFound } from '../lib/errors.js';
import { cvFileSchema } from '../validation/schemas.js';
import { recordAudit } from '../services/audit.service.js';

const router = Router();

const uploadDirAbsolute = (): string => {
  const env = (() => {
    try {
      return getEnv();
    } catch {
      return { UPLOAD_DIR: 'uploads', MAX_UPLOAD_MB: 25 };
    }
  })();
  // Serverless filesystems are read-only except for /tmp.
  const base = process.env.VERCEL === '1' ? '/tmp' : process.cwd();
  const dir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(base, env.UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore on read-only filesystems.
    }
  }
  return dir;
};

// Store CV files in MongoDB (base64) so they survive Vercel's ephemeral /tmp.
// We also write to disk locally so legacy dev flows keep working.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new Error('CV uploads must be PDF files'));
      return;
    }
    cb(null, true);
  },
});

const buildFilename = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase();
  const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `cv-${unique}${ext}`;
};

const writeToDisk = (filename: string, buffer: Buffer): void => {
  try {
    const dir = uploadDirAbsolute();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
  } catch {
    // Read-only / ephemeral filesystem — DB is the source of truth.
  }
};

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
      if (!doc || doc.isPublic === false) throw notFound('No public CV available');
      const fileName = String(doc.originalName ?? 'CV.pdf');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      // Preferred: bytes stored in MongoDB (survives serverless cold starts).
      if (typeof doc.contentBase64 === 'string' && doc.contentBase64) {
        const buffer = Buffer.from(doc.contentBase64, 'base64');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
        return;
      }

      // Legacy fallback: file on disk.
      const absolute = path.join(uploadDirAbsolute(), String(doc.filename ?? ''));
      if (!fs.existsSync(absolute)) throw notFound('CV file missing');
      res.sendFile(absolute);
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
      const filename = buildFilename(req.file.originalname);
      const doc = {
        filename,
        originalName: req.file.originalname,
        label: meta.label,
        isPublic: meta.isPublic ?? true,
        notes: meta.notes,
        size: req.file.size,
        mimeType: 'application/pdf',
        contentBase64: req.file.buffer.toString('base64'),
        active: makeActive,
        createdAt: now,
        updatedAt: now,
      };
      const result = await getDb().collection('cv_files').insertOne(doc);
      writeToDisk(filename, req.file.buffer);
      await recordAudit({ req, action: 'upload_cv', resource: 'cv_files', resourceId: String(result.insertedId) });
      res.status(201).json({ success: true, data: { ...doc, contentBase64: undefined, _id: result.insertedId } });
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
