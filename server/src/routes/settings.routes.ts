import { Router, type Response, type NextFunction } from 'express';
import { getDb } from '../db/database';
import { authenticate, requireAdmin, type AuthRequest } from '../middleware/auth.middleware';
import { siteSettingsSchema } from '../validation/schemas';

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
    const data = siteSettingsSchema.parse(req.body);
    const now = new Date().toISOString();
    const saved = await getDb()
      .collection('site_settings')
      .findOneAndUpdate(
        { _id: SETTINGS_ID },
        { $set: { ...data, updatedAt: now }, $setOnInsert: { createdAt: now } },
        { returnDocument: 'after', upsert: true }
      );
    await recordAuditSafe(req, 'update', 'site_settings');
    res.json({ success: true, data: saved ?? { ...defaultSettings(), ...data, updatedAt: now } });
  })
);

const recordAuditSafe = async (req: AuthRequest, action: string, resource: string) => {
  const { recordAudit } = await import('../services/audit.service');
  await recordAudit({ req, action, resource });
};

export default router;
