/**
 * One-off migration: backfill the media library records in MongoDB with the
 * actual image bytes (base64) so they are served durably by the API instead of
 * pointing at /uploads/<file> entries that only ever lived in Vercel's ephemeral
 * /tmp filesystem (which 404 after a cold start).
 *
 *   npx tsx server/src/scripts/backfill-media.ts
 *
 * Matching strategy (against the local uploads/ directory):
 *   1. exact filename match
 *   2. originalName match (case-insensitive)
 *   3. "base name" match — strip the generated `-<timestamp>-<hex8>` suffix from
 *      the stored filename and compare to a local file's base name.
 *
 * Safe to re-run: records that already have contentBase64 are skipped.
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { getDb, connectToMongoDB, checkDatabaseHealth } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '../../..');

const uploadsDir = process.env.UPLOAD_DIR
  ? (path.isAbsolute(process.env.UPLOAD_DIR)
      ? process.env.UPLOAD_DIR
      : path.join(repoRoot, process.env.UPLOAD_DIR))
  : path.join(repoRoot, 'uploads');

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, ' ');

/** Strip a generated trailing `-<digits>-<hex8>` suffix and keep the extension. */
const baseName = (value: string): string => value.replace(/-\d+-[0-9a-f]{8}(\.[^.]+)$/i, '$1');

interface MediaDoc {
  _id: { toString(): string } | string;
  filename?: string;
  originalName?: string;
  contentBase64?: string;
}

async function findLocalFile(
  files: string[],
  filename: string | undefined,
  originalName: string | undefined,
): Promise<string | null> {
  if (!filename && !originalName) return null;

  if (filename && files.includes(filename)) return filename;

  const normOriginals = new Map(files.map((f) => [normalize(f), f]));

  if (originalName) {
    const hit = normOriginals.get(normalize(originalName));
    if (hit) return hit;
  }

  if (filename) {
    const storedBase = baseName(filename).toLowerCase().replace(/[^a-z0-9-]/g, '');
    for (const f of files) {
      const localBase = baseName(f).toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (localBase && (localBase === storedBase || storedBase === localBase)) {
        return f;
      }
    }
  }

  return null;
}

const run = async (): Promise<void> => {
  await connectToMongoDB();
  const health = await checkDatabaseHealth();
  if (!health.ok) {
    console.error('Database unavailable:', health.error);
    process.exit(1);
  }

  if (!fs.existsSync(uploadsDir)) {
    console.error(`Uploads dir not found: ${uploadsDir}`);
    process.exit(1);
  }
  const files = fs.readdirSync(uploadsDir);
  console.log(`Local uploads dir: ${uploadsDir} (${files.length} files)`);

  const collection = getDb().collection('media');
  const docs = (await collection
    .find({ contentBase64: { $exists: false } })
    .limit(2000)
    .toArray()) as MediaDoc[];

  console.log(`Media records missing bytes: ${docs.length}`);

  let fixed = 0;
  let skipped = 0;
  for (const doc of docs) {
    const id = String(doc._id);
    const local = await findLocalFile(files, doc.filename, doc.originalName);
    if (!local) {
      skipped++;
      console.log(`  NOT FOUND: ${id} (filename=${doc.filename ?? '-'}, original=${doc.originalName ?? '-'})`);
      continue;
    }
    const filePath = path.join(uploadsDir, local);
    const buffer = fs.readFileSync(filePath);
    const url = `/api/media/${id}/file`;
    await collection.updateOne(
      { _id: id },
      {
        $set: {
          contentBase64: buffer.toString('base64'),
          url,
          size: buffer.length,
          updatedAt: new Date().toISOString(),
        },
      },
    );
    fixed++;
    console.log(`  FIXED: ${id} <- ${local} (${buffer.length} bytes) -> ${url}`);
  }

  console.log(`\nDone. fixed=${fixed}, skipped(not found locally)=${skipped}`);
};

run()
  .then(() => {
    console.log('Backfill complete.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Backfill failed:', error);
    process.exit(1);
  });