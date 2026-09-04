import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database.js';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.middleware.js';
import { siteSettingsSchema } from '../validation/schemas.js';
import { logger } from '../lib/logger.js';

const router = Router();
const SETTINGS_ID = 'site_settings_singleton';

const defaultSettings = () => ({
  _id: SETTINGS_ID,
  siteName: 'Dipesh Thapa — Research Portfolio',
  siteDescription: '',
  siteUrl: '',
  contactEmail: '',
  theme: {
    defaultTheme: 'dark' as const,
    accentColor: '#38bdf8',
    accentColorSecondary: '#a78bfa',
    fontFamilyHeading: 'Inter',
    fontFamilyBody: 'Inter',
    darkBackground: '#04070f',
    lightBackground: '#f7f9fc',
    radius: '0.75rem',
  },
  footer: {},
  socialLinks: {},
  contactPurposes: [],
  reducedEffectsDefault: false,
});

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
  wrap(async (_req, res) => {
    const doc = (await getDb()
      .collection('site_settings')
      .findOne({ _id: SETTINGS_ID })) as unknown;
    // Return defaults merged with any existing data so the admin UI always has values
    res.json({ success: true, data: doc ?? defaultSettings() });
  })
);

router.put(
  '/',
  authenticate,
  requireAdmin,
  wrap(async (req, res) => {
    // Strip server-managed fields that the client may have sent
    const { _id, createdAt, updatedAt, ...cleanBody } = req.body ?? {};
    const data = siteSettingsSchema.parse(cleanBody);
    const now = new Date().toISOString();
    const db = getDb();
    let result: Record<string, unknown> | null = null;
    try {
      result = await db
        .collection('site_settings')
        .findOneAndUpdate(
          { _id: SETTINGS_ID },
          { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
          { returnDocument: 'after', upsert: true }
        );
    } catch (dbError) {
      // Database operation failed — return a clear error rather than 500
      logger.error('Settings update database error', { error: String(dbError) });
      res.status(503).json({
        error: { message: 'Database unavailable. Please try again.', code: 'db_unavailable' },
      });
      return;
    }
    await recordAuditSafe(req, 'update', 'site_settings');
    const saved = result ?? { ...defaultSettings(), ...data, updatedAt: now, _id: SETTINGS_ID };
    res.json({ success: true, data: saved });
  })
);

const recordAuditSafe = async (req: AuthRequest, action: string, resource: string) => {
  try {
    const { recordAudit } = await import('../services/audit.service');
    await recordAudit({ req, action, resource });
  } catch {
    // Audit logging must never break request flow
  }
};

export default router;
