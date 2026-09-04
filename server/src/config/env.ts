import { z } from 'zod';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  MONGODB_URI: z.string().optional(),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('dev-secret-key-change-in-production-12345'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  ADMIN_EMAIL: z.string().email().default('admin@dipeshthapa.local'),
  ADMIN_PASSWORD: z.string().min(8, 'ADMIN_PASSWORD must be at least 8 characters').default('ChangeMe!2026'),
  ADMIN_NAME: z.string().default('Site Administrator'),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_MB: z.coerce.number().default(25),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Best-effort load of the repo-root .env file. Safe to call on every getEnv():
 * on Vercel the .env is never deployed (it is gitignored) so this is a no-op and
 * the platform-injected environment variables are used instead. dotenv does not
 * override variables that are already set.
 */
const loadDotenv = (): void => {
  try {
    dotenv.config({ path: path.join(__dirname, '../../.env'), quiet: true });
  } catch {
    // No .env available (e.g. Vercel) — rely on real process.env.
  }
};

export const getEnv = (): Env => {
  // Do not cache. getEnv() can be invoked during ESM import evaluation (e.g.
  // media.routes' multer config) BEFORE index.ts calls dotenv.config(), so a
  // stale cache would silently drop values like MONGODB_URI that get loaded
  // from .env a moment later.
  loadDotenv();
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration -> ${issues}`);
  }
  return parsed.data;
};

export const isProduction = (): boolean => getEnv().NODE_ENV === 'production';
