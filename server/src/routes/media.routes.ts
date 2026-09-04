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

// Vercel serverless filesystems are read-only except /tmp, which is ephemeral
// and wiped between cold starts. So uploaded files are stored as base64 inside
// MongoDB (the durable source of truth) AND written to disk for local use.
// They are served from the DB via GET /api/media/:id/file.
const upload = multer({
  storage: multer.memoryStorage(),
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

// Build a safe, unique filename from the uploaded original.
const buildFilename = (originalName: string): string => {
  const ext = path.extname(originalName).toLowerCase().slice(0, 12);
  const base = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .slice(0, 60);
  const unique = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  return `${base || 'file'}-${unique}${ext}`;
};

// Also persist the buffer to disk so local development and existing /uploads
// paths keep working. On Vercel this write is a best-effort to /tmp (ephemeral).
const writeToDisk = (filename: string, buffer: Buffer): void => {
  try {
    const dir = uploadDirAbsolute();
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, filename), buffer);
  } catch {
    // Read-only / ephemeral filesystem — DB is the source of truth.
  }
};

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
      const filename = buildFilename(req.file.originalname);
      const doc = {
        filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        url: '',
        contentBase64: req.file.buffer.toString('base64'),
        ...meta,
        visibility: meta.visibility ?? true,
        createdAt: now,
        updatedAt: now,
      };
      const result = await getDb().collection('media').insertOne(doc);
      // Durable URL that is served from MongoDB (persists on Vercel serverless).
      const url = `/api/media/${String(result.insertedId)}/file`;
      await getDb().collection('media').findOneAndUpdate(
        { _id: String(result.insertedId) },
        { $set: { url } },
        { returnDocument: 'after' }
      );
      writeToDisk(filename, req.file.buffer);
      await recordAudit({ req, action: 'upload', resource: 'media', resourceId: String(result.insertedId), detail: { filename } });
      res.status(201).json({ success: true, data: { ...doc, url, _id: result.insertedId } });
    } catch (error) {
      next(error);
    }
  }
);

/** Public file serving backed by MongoDB (durable across serverless cold starts). */
router.get(
  '/:id/file',
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const doc = (await getDb().collection('media').findOne({ _id: String(req.params.id) })) as MediaDoc | null;
      if (!doc) throw notFound('Media not found');

      // Preferred source of truth: base64 stored in MongoDB.
      if (typeof doc.contentBase64 === 'string' && doc.contentBase64) {
        const buffer = Buffer.from(doc.contentBase64, 'base64');
        res.setHeader('Content-Type', String(doc.mimeType ?? 'application/octet-stream'));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
        return;
      }

      // Legacy fallback: file on disk.
      const absolute = path.join(uploadDirAbsolute(), String(doc.filename ?? ''));
      if (fs.existsSync(absolute)) {
        res.setHeader('Content-Type', String(doc.mimeType ?? 'application/octet-stream'));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.sendFile(absolute);
        return;
      }

      throw notFound('Media file missing');
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
