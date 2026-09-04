/**
 * Idempotent seed / CV-import process.
 *
 *   npm run seed   |   npm run import:cv
 *
 * - Creates collections when missing.
 * - Ensures the admin user exists.
 * - Upserts the structured dataset transcribed from the supplied CV +
 *   certificates PDFs (natural-key based, safe to re-run).
 * - Copies provided photo assets and certificate scans into the upload
 *   directory and registers them in the media library.
 * - Registers the supplied CV PDF as the active public CV version.
 */
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { getDb, checkDatabaseHealth, connectToMongoDB } from '../db/database.js';
import { getEnv } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { ensureAdminUser } from '../services/audit.service.js';
import {
  aboutSeed,
  educationSeed,
  researchSeed,
  projectSeed,
  publicationSeed,
  experienceSeed,
  internshipSeed,
  researchExperienceSeed,
  skillSeed,
  languageSeed,
  hobbySeed,
  membershipSeed,
  conferenceSeed,
  trainingSeed,
  recommendationSeed,
} from '../data/cv-seed-data';
import {
  siteSettingsSeed,
} from '../data/site-seed';

dotenv.config({ path: path.join(__dirname, '../../../.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.join(process.cwd(), '.env') });
}

const nowIso = () => new Date().toISOString();
const withTimestamps = <T>(doc: T): T & { createdAt: string; updatedAt: string } => ({
  ...(doc as Record<string, unknown>),
  createdAt: nowIso(),
  updatedAt: nowIso(),
} as T & { createdAt: string; updatedAt: string });

const COLLECTIONS = [
  'users',
  'site_settings',
  'pages',
  'about',
  'education',
  'research',
  'projects',
  'publications',
  'experience',
  'internships',
  'research_experience',
  'skills',
  'conferences',
  'training',
  'memberships',
  'languages',
  'hobbies',
  'recommendations',
  'blog_posts',
  'contact_messages',
  'media',
  'cv_files',
  'seo',
  'audit_logs',
] as const;

const SETTINGS_ID = 'site_settings_singleton';

type Doc = Record<string, unknown> & { _id?: string };

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

async function initCollections(): Promise<void> {
  const db = getDb();
  const existing = new Set((await db.listCollections()).map((c: { name: string }) => c.name));
  for (const name of COLLECTIONS) {
    if (!existing.has(name)) {
      try {
        await db.createCollection(name);
      } catch (error) {
        logger.warn(`Could not create collection "${name}": ${String(error)}. It may need to be created manually.`);
      }
    }
  }
  logger.info(`Collections ensured (${COLLECTIONS.length}).`);
}

/** Upsert by a natural key so repeated runs never duplicate records. */
async function upsertMany(
  collectionName: string,
  docs: readonly object[],
  naturalKeyFields: string[]
): Promise<number> {
  const collection = getDb().collection(collectionName);
  let written = 0;
  for (const raw of docs) {
    const doc = raw as Doc;
    const filter: Record<string, unknown> = {};
    for (const field of naturalKeyFields) filter[field] = doc[field];
    const result = await collection.updateOne(filter, { $set: doc }, { upsert: true });
    if (result.upsertedId || result.modifiedCount) written += 1;
  }
  logger.info(`${collectionName}: ${written}/${docs.length} records upserted.`);
  return written;
}

function copyIntoUploads(sourcePath: string, destName: string): string | null {
  try {
    const env = getEnv();
    const uploadsDir = path.isAbsolute(env.UPLOAD_DIR)
      ? env.UPLOAD_DIR
      : path.join(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const dest = path.join(uploadsDir, destName);
    if (!fs.existsSync(dest)) fs.copyFileSync(sourcePath, dest);
    return destName;
  } catch (error) {
    logger.warn(`Could not copy ${sourcePath}: ${String(error)}`);
    return null;
  }
}

function repoRoot(): string {
  return path.join(__dirname, '../../..');
}

/* ------------------------------------------------------------------ */
/* Media + CV registration                                             */
/* ------------------------------------------------------------------ */

async function seedMedia(): Promise<void> {
  const media = getDb().collection('media');
  const entries: Array<{ file: string; category: string; altText: string; roles: string[] }> = [];

  // Provided site imagery
  const rootImages: Array<[string, string]> = [
    ['hero.jpg', 'Site hero background image.'],
    ['14.jpg', 'Personal photograph (to be catalogued via the CMS).'],
  ];
  for (const [file, alt] of rootImages) {
    const abs = path.join(repoRoot(), file);
    if (fs.existsSync(abs)) {
      entries.push({
        file,
        category: file === 'hero.jpg' ? 'site' : 'personal',
        altText: alt,
        roles: file === 'hero.jpg' ? ['hero', 'background'] : ['gallery'],
      });
    }
  }

  // WhatsApp photos (content not machine-readable at import time; admin can caption)
  const whatsapp = fs
    .readdirSync(repoRoot())
    .filter((f) => f.startsWith('WhatsApp Image') && /\.(jpe?g|png)$/i.test(f))
    .sort();
  whatsapp.forEach((file, index) => {
    entries.push({
      file,
      category: 'personal',
      altText: `Personal photograph ${index + 1} â€” caption pending (edit in Media Library).`,
      roles: ['gallery'],
    });
  });

  // Extracted certificate scans
  const certDir = path.join(repoRoot(), 'server/uploads-seed/certificates');
  if (fs.existsSync(certDir)) {
    for (const file of fs.readdirSync(certDir).sort()) {
      if (file.startsWith('awards-p32') || file.startsWith('awards-p35')) continue; // tiny logo fragments
      entries.push({
        file: `uploads-seed/certificates/${file}`,
        category: 'certificates',
        altText: `Certificate scan â€” ${file.replace(/\.[a-z]+$/i, '')}`,
        roles: ['certificate'],
      });
    }
  }

  let registered = 0;
  for (const entry of entries) {
    const sourceAbs = path.join(repoRoot(), entry.file);
    if (!fs.existsSync(sourceAbs)) continue;
    const destName = path.basename(entry.file);
    const storedName =
      entry.file.includes('/') && !entry.file.startsWith('uploads-seed')
        ? destName
        : copyIntoUploads(sourceAbs, destName) ?? destName;
    const url = `/uploads/${storedName}`;
    const size = (() => {
      try {
        return fs.statSync(path.join(process.cwd(), 'uploads', storedName)).size;
      } catch {
        return 0;
      }
    })();
    await media.updateOne(
      { originalName: path.basename(entry.file), category: entry.category },
      {
        $set: withTimestamps({
          filename: storedName,
          originalName: path.basename(entry.file),
          mimeType: /\.pdf$/i.test(entry.file)
            ? 'application/pdf'
            : /\.svg$/i.test(entry.file)
              ? 'image/svg+xml'
              : /\.png$/i.test(entry.file)
                ? 'image/png'
                : 'image/jpeg',
          size,
          url,
          altText: entry.altText,
          caption: '',
          credits: '',
          category: entry.category,
          roles: entry.roles,
          assignedTo: [],
          visibility: true,
        }),
      },
      { upsert: true }
    );
    registered += 1;
  }
  logger.info(`media: ${registered} assets registered.`);
}

async function seedCvFile(): Promise<void> {
  const cvFiles = getDb().collection('cv_files');
  const cvSource = path.join(repoRoot(), 'Dipesh Thapa CV.pdf');
  if (!fs.existsSync(cvSource)) {
    logger.warn('CV PDF not found at project root â€” skipping cv_files seed.');
    return;
  }
  const env = getEnv();
  const uploadsDir = path.isAbsolute(env.UPLOAD_DIR)
    ? env.UPLOAD_DIR
    : path.join(process.cwd(), env.UPLOAD_DIR);
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const existingActive = (await cvFiles.findOne({ active: true })) as Doc | null;
  if (existingActive) {
    logger.info('cv_files: active CV already present â€” skipping.');
    return;
  }

  const storedName = 'cv-dipesh-thapa.pdf';
  fs.copyFileSync(cvSource, path.join(uploadsDir, storedName));
  await cvFiles.insertOne(
    withTimestamps({
      filename: storedName,
      originalName: 'Dipesh Thapa CV.pdf',
      label: 'Master CV (source document)',
      isPublic: true,
      active: true,
      notes: 'Imported automatically from the supplied CV document.',
      mimeType: 'application/pdf',
      size: fs.statSync(cvSource).size,
      url: '/api/cv/download',
    })
  );
  logger.info('cv_files: active public CV registered.');
}

async function seedSiteSettings(): Promise<void> {
  const settings = getDb().collection('site_settings');
  const existing = await settings.findOne({ _id: SETTINGS_ID });
  if (existing) {
    logger.info('site_settings: present â€” skipping (edit via Admin â†’ Settings).');
    return;
  }
  await settings.insertOne(withTimestamps({ _id: SETTINGS_ID, ...siteSettingsSeed }));
  logger.info('site_settings: seeded defaults.');
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export async function runSeed(): Promise<void> {
  await connectToMongoDB();
  const health = await checkDatabaseHealth();
  if (!health.ok) {
    throw new Error(`MongoDB is unreachable — check connection string. (${health.error ?? 'unknown error'})`);
  }

  await initCollections();

  const admin = await ensureAdminUser();
  logger.info(
    admin.created
      ? `users: admin created for ${admin.email}.`
      : `users: admin ${admin.email} already exists.`
  );

  await seedSiteSettings();




  // Recommendations keep private contact details hidden until enabled in the CMS.
  await upsertMany(
    'recommendations',
    recommendationSeed.map((r) =>
      withTimestamps({ ...r, publicVisibility: false, showEmail: false, showPhone: false })
    ),
    ['name']
  );

    // Blog posts
  const sampleBlogPosts = [
    {
      title: 'Why Antimicrobial Resistance Needs a One Health Lens',
      slug: 'amr-one-health-perspective',
      excerpt: 'Resistance does not respect borders between clinics, farms and rivers.',
      content: 'Antimicrobial resistance (AMR) is one of the clearest examples of why microbiology cannot be studied in isolation.\\n\\n## The problem\\n\\nResistant strains emerging in clinical settings are frequently linked to environmental reservoirs.\\n\\n## What One Health changes\\n\\n- Surveillance across human, animal and environmental sectors\\n- Shared diagnostics and open data standards\\n- Stewardship programmes that span disciplines',
      tags: ['AMR', 'One Health', 'Public Health'],
      category: 'Research Notes',
      status: 'published',
      author: 'Dipesh Thapa',
      publicationDate: '2026-07-14',
      readingTime: 5,
      featured: true,
      coverImage: '/images/hero.jpg',
      contentFont: 'Merriweather',
    },
    {
      title: 'From Pipette to Policy: Lessons from Public Health Training',
      slug: 'from-pipette-to-policy',
      excerpt: 'What a laboratory bench taught me about health systems.',
      content: 'Moving between molecular biology labs and public-health classrooms reshaped how I think about evidence.\\n\\n## Bench skills travel further than you expect\\n\\nPrecision, documentation and reproducibility matter equally in epidemiology.',
      tags: ['Career', 'Public Health', 'Laboratory'],
      category: 'Reflections',
      status: 'published',
      author: 'Dipesh Thapa',
      publicationDate: '2026-06-02',
      readingTime: 4,
      coverImage: '/images/hero.jpg',
      contentFont: 'Inter',
    },
  ];

  await seedMedia();
  await seedCvFile();

  logger.info('Seed completed successfully.');
}

if (require.main === module) {
  runSeed()
    .then(() => process.exit(0))
    .catch((error) => {
      logger.error('Seed failed', { error: String(error?.stack ?? error) });
      process.exit(1);
    });
}
