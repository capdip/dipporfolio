import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { getEnv } from '../config/env.js';
import { authenticate, requireStaff, type AuthRequest } from '../middleware/auth.middleware.js';
import { badRequest, notFound } from '../lib/errors.js';
import { mediaMetadataSchema } from '../validation/schemas.js';
import { recordAudit } from '../services/audit.service.js';

const router = Router();

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
]);

const uploadDirAbsolute = () => {
  const env = getEnv();
  // Serverless filesystems are read-only except for /tmp.
  const base = process.env.VERCEL === '1' ? '/tmp' : process.cwd();
  const dir = path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(base, env.UPLOAD_DIR);
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore on read-only filesystems.
    }
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDirAbsolute()),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().slice(0, 12);
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .slice(0, 60);
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    cb(null, `${base || 'file'}-${unique}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: getEnvSafe().MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

function getEnvSafe() {
  // multer config is evaluated at import time; fall back to defaults before dotenv runs.
  try {
    return getEnv();
  } catch {
    return {
      UPLOAD_DIR: 'uploads',
      MAX_UPLOAD_MB: 25,
    };
  }
}

type MediaDoc = Record<string, unknown> & { _id: string };

router.get(
  '/',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const filter: Record<string, unknown> = {};
      const isStaff = Boolean(req.user);
      if (!isStaff) filter.visibility = true;
      if (typeof req.query.category === 'string' && req.query.category && req.query.category !== 'all') {
        filter.category = req.query.category;
      }
      if (typeof req.query.role === 'string' && req.query.role) {
        filter.roles = req.query.role;
      }
      let docs = await getDb()
        .collection('media')
        .find(filter, { sort: { createdAt: -1 as const } })
        .limit(500)
        .toArray();

      const search = typeof req.query.search === 'string' ? req.query.search.trim().toLowerCase() : '';
      if (search) {
        docs = docs.filter((d: MediaDoc) => {
          const hay = `${d.originalName ?? ''} ${d.altText ?? ''} ${d.caption ?? ''}`.toLowerCase();
          return hay.includes(search);
        });
      }
      res.json({ success: true, data: docs });
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
      const meta = mediaMetadataSchema.parse(req.body.metadata ? JSON.parse(req.body.metadata) : {});
      const now = new Date().toISOString();
      const doc = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: `/uploads/${req.file.filename}`,
        ...meta,
        visibility: meta.visibility ?? true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await getDb().collection('media').insertOne(doc);
      await recordAudit({ req, action: 'upload', resource: 'media', resourceId: String(result.insertedId), detail: { filename: doc.filename } });
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
      const meta = mediaMetadataSchema.partial().parse(req.body);
      delete meta.visibility;
      const set: Record<string, unknown> = { ...meta, updatedAt: new Date().toISOString() };
      if (typeof req.body.visibility === 'boolean') set.visibility = req.body.visibility;
      const result = await getDb()
        .collection('media')
        .findOneAndUpdate({ _id: String(req.params.id) }, { $set: set }, { returnDocument: 'after' });
      if (!result) throw notFound('Media not found');
      await recordAudit({ req, action: 'update', resource: 'media', resourceId: String(req.params.id) });
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
      const doc = (await getDb().collection('media').findOne({ _id: String(req.params.id) })) as MediaDoc | null;
      if (!doc) throw notFound('Media not found');
      const absolute = path.join(uploadDirAbsolute(), String(doc.filename));
      if (fs.existsSync(absolute)) fs.unlinkSync(absolute);
      await getDb().collection('media').deleteOne({ _id: doc._id });
      await recordAudit({ req, action: 'delete', resource: 'media', resourceId: String(req.params.id) });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
