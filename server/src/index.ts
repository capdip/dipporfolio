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
import { connectToMongoDB, checkDatabaseHealth, getDb } from './db/database.js';
import { logger } from './lib/logger.js';

const app: Express = express();
const env = getEnv();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  cors({
    origin: [env.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
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
  res.status(dbHealth.ok ? 200 : 503).json({
    status: dbHealth.ok ? 'ok' : 'degraded',
    database: dbHealth.ok ? 'connected' : 'unreachable',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
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

// Uploaded media (public read)
const uploadsDir = isVercel
  ? path.join('/tmp', 'uploads')
  : path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const bundledCv = path.join(__dirname, '../public/cv/Dipesh-Thapa-CV.pdf');
const bundledCvTarget = path.join(uploadsDir, 'Dipesh-Thapa-CV.pdf');
if (fs.existsSync(bundledCv) && !fs.existsSync(bundledCvTarget)) {
  fs.copyFileSync(bundledCv, bundledCvTarget);
}
// Also expose the bundled hero image under /uploads so media-referenced urls work.
const bundledHero = path.join(__dirname, '../public/hero.jpg');
const bundledHeroTarget = path.join(uploadsDir, 'hero.jpg');
if (fs.existsSync(bundledHero) && !fs.existsSync(bundledHeroTarget)) {
  fs.copyFileSync(bundledHero, bundledHeroTarget);
}
app.use('/downloads', express.static(path.join(__dirname, '../public'), { maxAge: '1d' }));
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: false }));
// Serve the bundle's public imagery (hero.jpg + generated gallery placeholders) at /images.
app.use('/images', express.static(path.join(__dirname, '../public'), { maxAge: '7d' }));

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
