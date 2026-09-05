import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';

const isVercel = process.env.VERCEL === '1';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });
if (!process.env.JWT_SECRET) {
  // Second attempt: repo-root .env when running via tsx from server/ cwd.
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

import { getEnv, isProduction } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import { createSingletonRouter } from './routes/singleton.routes.js';
import contactRoutes from './routes/contact.routes.js';
import mediaRoutes from './routes/media.routes.js';
import cvRoutes from './routes/cv.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import auditRoutes from './routes/audit.routes.js';
import { createResourceRouter } from './routes/resource.routes.js';
import { aboutUpdateSchema, resourceSchemas } from './validation/schemas.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { globalRateLimiter } from './middleware/rate-limit.middleware.js';
import { connectToMongoDB, checkDatabaseHealth, getDb, ensureMongoConnection } from './db/database.js';
import { logger } from './lib/logger.js';

const app: Express = express();
const env = getEnv();

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Accept one or more origins via FRONTEND_URL (comma-separated), plus the
// deployed Vercel URL(s) supplied automatically by the platform.
const allowedOrigins = [
  ...env.FRONTEND_URL.split(',').map((o) => o.trim()).filter(Boolean),
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://dipeshthapa23.com.np',
  'https://www.dipeshthapa23.com.np',
];
if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
}
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin/no-origin requests (server-rendered pages, curl, health checks)
      if (!origin) {
        callback(null, true);
        return;
      }
      try {
        const hostname = new URL(origin).hostname;
        if (allowedOrigins.includes(origin) || hostname.endsWith('.vercel.app')) {
          callback(null, true);
          return;
        }
      } catch {
        /* malformed origin — fall through to reject */
      }
      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Minimal security headers (helmet-equivalent without extra dependency weight).
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (isProduction()) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.use(globalRateLimiter);

// SELF-HEALING DB GUARD: before any API request, if MongoDB is configured but
// the connection is degraded (e.g. a cold-start timeout), retry it. This is
// what makes regular routes (/api/education etc.) recover — not just /api/health.
app.use('/api', (_req: Request, _res: Response, next: NextFunction): void => {
  void (async () => {
    try {
      await ensureMongoConnection();
    } catch {
      // Never block request flow on reconnect failures.
    }
    next();
  })();
});

app.use((req: Request, res: Response, _next: NextFunction) => {
  // Never let browsers/proxies cache API responses.
  if (req.path.startsWith('/api')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
  }
  logger.info('request', { method: req.method, path: req.path, status: res.statusCode });
  _next();
});

// ---------------- Health ----------------

app.get('/api/health', async (_req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth();
  const dbUri = env.MONGODB_URI;
  // Mask credentials in the URI for safe logging
  const maskedUri = dbUri ? dbUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : 'not set';

  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    database: dbHealth.ok ? 'connected' : 'unreachable',
    storage: dbUri ? 'mongodb' : 'in-memory (data will not persist between requests)',
    mongoUri: maskedUri,
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV ?? 'unknown',
    ...(dbHealth.error ? { error: dbHealth.error } : {}),
    ...(dbHealth.collections
      ? { collections: dbHealth.collections }
      : {}),
  });
});

// ---------------- API routes ----------------

app.use('/api/auth', authRoutes);
app.use('/api/about', createSingletonRouter('about', (body) => aboutUpdateSchema.parse(body) as Record<string, unknown>));
app.use('/api/settings', settingsRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/cv', cvRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/audit-logs', auditRoutes);

// Collection names intentionally match the public resource paths so that
// seeded documents are visible through the API without renaming.
const COLLECTION_NAME_MAP: Record<string, string> = {
  blog: 'blog_posts',
};

for (const [name, schema] of Object.entries(resourceSchemas)) {
  app.use(
    `/api/${name}`,
    createResourceRouter({
      name,
      collectionName: COLLECTION_NAME_MAP[name] ?? name,
      schema,
      searchFields:
        name === 'publications'
          ? ['title', 'authors']
          : name === 'blog'
            ? ['title', 'tags', 'category']
            : ['title', 'organization', 'institution'],
      ...(name === 'blog' ? { publicFilter: { status: 'published' }, sort: { publicationDate: -1 as const } } : {}),
    })
  );
}

// Uploaded media (public read). Resolve candidate base dirs that work both
// locally and inside the Vercel serverless bundle, where __dirname differs.
const candidateBaseDirs = [
  path.join(__dirname, '..'),
  path.join(__dirname, '../..'),
  process.cwd(),
];
const findExisting = (...segments: string[]): string | null => {
  for (const base of candidateBaseDirs) {
    const candidate = path.join(base, ...segments);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
};

// Uploaded media (public read)
const uploadsDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch {
    // Read-only filesystem — /tmp is used on Vercel, so this is unexpected.
  }
}
const bundledCv = findExisting('server', 'public', 'cv', 'Dipesh-Thapa-CV.pdf');
const bundledCvTarget = path.join(uploadsDir, 'Dipesh-Thapa-CV.pdf');
if (bundledCv && !fs.existsSync(bundledCvTarget)) {
  try { fs.copyFileSync(bundledCv, bundledCvTarget); } catch { /* read-only fs */ }
}
// Also expose the bundled hero image under /uploads so media-referenced urls work.
const bundledHero = findExisting('server', 'public', 'hero.jpg');
const bundledHeroTarget = path.join(uploadsDir, 'hero.jpg');
if (bundledHero && !fs.existsSync(bundledHeroTarget)) {
  try { fs.copyFileSync(bundledHero, bundledHeroTarget); } catch { /* read-only fs */ }
}
const publicDir = findExisting('server', 'public') ?? path.join(process.cwd(), 'server', 'public');
app.use('/downloads', express.static(publicDir, { maxAge: '1d' }));

// Legacy /uploads/<filename> references (e.g. hero, about, project and publication
// images saved before media was stored in MongoDB). On Vercel the file may no
// longer exist on disk (/tmp is ephemeral), so fall back to the bytes we now keep
// in MongoDB. This must be registered before the static mount below.
app.get('/uploads/:filename', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const name = req.params.filename as string;
    const doc = (await getDb().collection('media').findOne({ filename: name })) as Record<string, unknown> | null;
    if (doc && typeof doc.contentBase64 === 'string' && doc.contentBase64) {
      const buffer = Buffer.from(doc.contentBase64, 'base64');
      res.setHeader('Content-Type', String(doc.mimeType ?? 'application/octet-stream'));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
      return;
    }
  } catch {
    // fall through to static / disk
  }
  next();
});

app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: false }));
// Serve the bundle's public imagery (hero.jpg + generated gallery placeholders) at /images.
app.use('/images', express.static(publicDir, { maxAge: '7d' }));

// Serve built client in production
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // Inject the latest about + settings content directly into the page HTML so
  // visitors always see current content even if client-side API calls fail.
  app.get(
    /^\/(?!api|uploads|assets|images|downloads).*/,
    (_req: Request, res: Response) => {
      void (async () => {
        try {
          const [about, settings] = await Promise.all([
            getDb().collection('about').findOne({ isActive: true }),
            getDb().collection('site_settings').findOne({}),
          ]);
          const html = await fs.promises.readFile(path.join(clientDist, 'index.html'), 'utf8');
          const swCleanup = `<script>if('serviceWorker' in navigator){navigator.serviceWorker.getRegistrations().then(function(rs){rs.forEach(function(r){r.unregister()})})}</script>`;
          const boot = `<script>window.__BOOT_DATA__=${JSON.stringify({ about, settings }).replace(/</g, '\\u003c')}</script>`;
          res.setHeader('Cache-Control', 'no-store');
          res.send(html.replace('<head>', '<head>' + swCleanup + boot));
        } catch {
          res.setHeader('Cache-Control', 'no-store');
          res.sendFile(path.join(clientDist, 'index.html'));
        }
      })();
    }
  );
}

app.use(notFoundHandler);
app.use(errorHandler);

// On Vercel, the server runs as a serverless function — no app.listen() needed.
// Connect to MongoDB lazily on first request to avoid cold-start penalties.
if (!isVercel) {
  const start = async (): Promise<void> => {
    try {
      await connectToMongoDB();
      const health = await checkDatabaseHealth();
      if (!health.ok) {
        logger.warn('Database unreachable at boot — API will serve degraded until it reconnects.');
      } else {
        logger.info(`Connected to MongoDB with ${health.collections?.length ?? 0} collections.`);
      }
      app.listen(env.PORT, () => {
        logger.info(`Server running on port ${env.PORT}`, { environment: env.NODE_ENV });
      });
    } catch (error) {
      logger.error('Fatal startup error', { error: String(error) });
      process.exit(1);
    }
  };

  start()
    .then(() => logger.debug('startup sequence complete'))
    .catch((error: unknown) => {
      logger.error('Unhandled startup failure', { error: String(error) });
      process.exit(1);
    });
} else {
  // Vercel: connect to DB on first invocation (non-blocking).
  void connectToMongoDB().catch((err) => {
    logger.warn('Initial MongoDB connection failed — will retry on first request', { error: String(err) });
  });
}

export default app;
