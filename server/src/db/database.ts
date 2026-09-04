import { MongoClient, type Db as MongoDb, type Collection as MongoCollection, type FindOptions as MongoFindOptions } from 'mongodb';
import { getEnv } from '../config/env';
import { logger } from '../lib/logger';
import { memDb } from './memory-backend';
import { seedMemoryData } from './memory-seed';
import crypto from 'crypto';

let client: MongoClient | null = null;
let cachedDb: MongoDb | null = null;
let degraded = false;
let seedPromise: Promise<void> | null = null;

const generateId = (): string => crypto.randomBytes(12).toString('hex');

const ensureSeeded = (): Promise<void> => {
  if (!seedPromise) seedPromise = seedMemoryData();
  return seedPromise;
};

/* ------------------------------------------------------------------ */
/* MongoDB cursor wrapper matching Astra DB / memory-backend API       */
/* ------------------------------------------------------------------ */

class MongoFindCursor {
  private _sort?: Record<string, 1 | -1>;
  private _limitN?: number;
  private _projection?: Record<string, unknown>;

  constructor(
    private col: MongoCollection,
    private filter: Record<string, unknown>,
    options?: { sort?: Record<string, 1 | -1>; limit?: number; projection?: Record<string, unknown> }
  ) {
    if (options?.sort) this._sort = options.sort;
    if (options?.limit) this._limitN = options.limit;
    if (options?.projection) this._projection = options.projection;
  }

  sort(spec: Record<string, 1 | -1>): this {
    this._sort = spec;
    return this;
  }

  limit(n: number): this {
    this._limitN = n;
    return this;
  }

  async toArray(): Promise<Record<string, unknown>[]> {
    const opts: MongoFindOptions = {};
    if (this._sort) opts.sort = this._sort;
    if (this._limitN) opts.limit = this._limitN;
    if (this._projection) opts.projection = this._projection;
    const cursor = this.col.find(this.filter as any, opts);
    const docs = await cursor.toArray();
    return docs.map((d) => ({ ...d, _id: String(d._id) }));
  }
}

/* ------------------------------------------------------------------ */
/* MongoDB collection wrapper matching memory-backend API              */
/* ------------------------------------------------------------------ */

class MongoCollectionWrapper {
  constructor(private col: MongoCollection) {}

  find(
    filter: Record<string, unknown> = {},
    options?: { sort?: Record<string, 1 | -1>; limit?: number; projection?: Record<string, unknown> }
  ): MongoFindCursor {
    return new MongoFindCursor(this.col, filter, options);
  }

  async findOne(filter: Record<string, unknown> = {}): Promise<Record<string, unknown> | null> {
    const doc = await this.col.findOne(filter as any);
    if (!doc) return null;
    return { ...doc, _id: String(doc._id) };
  }

  async insertOne(doc: Record<string, unknown>): Promise<{ insertedId: string }> {
    const _id = String(doc._id ?? generateId());
    const data = { ...doc, _id };
    await this.col.insertOne(data as any);
    return { insertedId: _id };
  }

  async insertMany(docs: Record<string, unknown>[]): Promise<{ insertedIds: string[] }> {
    const ids: string[] = [];
    for (const doc of docs) {
      const result = await this.insertOne(doc);
      ids.push(result.insertedId);
    }
    return { insertedIds: ids };
  }

  async updateOne(
    filter: Record<string, unknown>,
    update: { $set?: Record<string, unknown>; $inc?: Record<string, unknown> },
    options?: { upsert?: boolean }
  ): Promise<{ modifiedCount: number; upsertedId?: string }> {
    const result = await this.col.updateOne(filter as any, update as any, { upsert: options?.upsert });
    return { modifiedCount: result.modifiedCount, upsertedId: result.upsertedId ? String(result.upsertedId) : undefined };
  }

  async updateMany(
    filter: Record<string, unknown>,
    update: { $set?: Record<string, unknown> }
  ): Promise<{ modifiedCount: number }> {
    const result = await this.col.updateMany(filter as any, update as any);
    return { modifiedCount: result.modifiedCount };
  }

  async findOneAndUpdate(
    filter: Record<string, unknown>,
    update: { $set?: Record<string, unknown>; $setOnInsert?: Record<string, unknown> },
    options: { returnDocument?: string; upsert?: boolean } = {}
  ): Promise<Record<string, unknown> | null> {
    const mongoUpdate: Record<string, unknown> = {};
    if (update.$set) mongoUpdate.$set = update.$set;
    if (update.$setOnInsert) mongoUpdate.$setOnInsert = update.$setOnInsert;
    if ((update as { $unset?: Record<string, unknown> }).$unset) {
      mongoUpdate.$unset = (update as { $unset: Record<string, unknown> }).$unset;
    }
    const result = await this.col.findOneAndUpdate(
      filter as any,
      mongoUpdate as any,
      { returnDocument: options.returnDocument === 'after' ? 'after' : 'before', upsert: options.upsert } as any
    );
    if (!result) return null;
    const doc = result as any;
    return { ...doc, _id: String(doc._id) };
  }

  async deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }> {
    const result = await this.col.deleteOne(filter as any);
    return { deletedCount: result.deletedCount };
  }

  countDocuments(): number {
    return 0;
  }
}

/* ------------------------------------------------------------------ */
/* MongoDB Db wrapper                                                  */
/* ------------------------------------------------------------------ */

class MongoDbWrapper {
  private collectionCache = new Map<string, MongoCollectionWrapper>();

  constructor(private db: MongoDb) {}

  collection(name: string): MongoCollectionWrapper {
    let wrapper = this.collectionCache.get(name);
    if (!wrapper) {
      wrapper = new MongoCollectionWrapper(this.db.collection(name));
      this.collectionCache.set(name, wrapper);
    }
    return wrapper;
  }

  async listCollections(): Promise<Array<{ name: string }>> {
    const collections = await this.db.listCollections().toArray();
    return collections.map((c) => ({ name: c.name }));
  }

  async createCollection(name: string): Promise<void> {
    await this.db.createCollection(name);
  }
}

let wrappedDb: MongoDbWrapper | null = null;

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const getDb = (): any => {
  if (!degraded && wrappedDb) {
    return wrappedDb;
  }
  void ensureSeeded();
  return memDb as unknown as any;
};

const HEALTH_TIMEOUT_MS = 10000;

export const connectToMongoDB = async (): Promise<void> => {
  const env = getEnv();
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI not set â€” falling back to in-memory store');
    degraded = true;
    await ensureSeeded();
    return;
  }
  try {
    client = new MongoClient(env.MONGODB_URI);
    await client.connect();
    cachedDb = client.db();
    wrappedDb = new MongoDbWrapper(cachedDb);
    logger.info(`Connected to MongoDB database: ${cachedDb.databaseName}`);

    // Auto-seed if database is empty
    const collections = await wrappedDb.listCollections();
    if (collections.length === 0) {
      logger.info('MongoDB database is empty â€” running auto-seed...');
      await autoSeedMongoDB();
    }
  } catch (error) {
    logger.error('Failed to connect to MongoDB â€” falling back to in-memory store', { error: String(error) });
    degraded = true;
    await ensureSeeded();
  }
};

const autoSeedMongoDB = async (): Promise<void> => {
  if (!wrappedDb) return;

  const env = getEnv();
  const now = new Date().toISOString();
  const withTimestamps = <T extends Record<string, unknown>>(doc: T): T & { createdAt: string; updatedAt: string } => ({
    ...doc,
    createdAt: now,
    updatedAt: now,
  } as T & { createdAt: string; updatedAt: string });

  // Import seed data
  const { aboutSeed, educationSeed, researchSeed, projectSeed, publicationSeed, experienceSeed, internshipSeed, researchExperienceSeed, skillSeed, languageSeed, hobbySeed, membershipSeed, conferenceSeed, trainingSeed, recommendationSeed } = await import('../data/cv-seed-data');
  const { siteSettingsSeed } = await import('../data/site-seed');
  const { hashPassword } = await import('../lib/password');

  const putList = async (name: string, items: Array<Record<string, unknown>>): Promise<void> => {
    const col = wrappedDb!.collection(name);
    for (const item of items) {
      await col.insertOne(withTimestamps({ visibility: true, ...item }));
    }
    logger.info(`Seeded ${items.length} records into "${name}".`);
  };

  // About singleton
  await wrappedDb.collection('about').insertOne(withTimestamps({ ...aboutSeed, isActive: true }));

  // Site settings
  await wrappedDb.collection('site_settings').insertOne(
    withTimestamps({ _id: 'site_settings_singleton', ...siteSettingsSeed })
  );

  // CV data collections
  await putList('education', educationSeed as unknown as Array<Record<string, unknown>>);
  await putList('research', researchSeed as unknown as Array<Record<string, unknown>>);
  await putList('projects', projectSeed as unknown as Array<Record<string, unknown>>);
  await putList('publications', publicationSeed as unknown as Array<Record<string, unknown>>);
  await putList('experience', experienceSeed as unknown as Array<Record<string, unknown>>);
  await putList('internships', internshipSeed as unknown as Array<Record<string, unknown>>);
  await putList('research-experience', researchExperienceSeed as unknown as Array<Record<string, unknown>>);
  await putList('skills', skillSeed as unknown as Array<Record<string, unknown>>);
  await putList('conferences', conferenceSeed as unknown as Array<Record<string, unknown>>);
  await putList('training', trainingSeed as unknown as Array<Record<string, unknown>>);
  await putList('memberships', membershipSeed as unknown as Array<Record<string, unknown>>);
  await putList('languages', languageSeed as unknown as Array<Record<string, unknown>>);
  await putList('hobbies', hobbySeed as unknown as Array<Record<string, unknown>>);
  await putList('recommendations', recommendationSeed as unknown as Array<Record<string, unknown>>);

  // Blog posts
  const sampleBlogPosts = [
    {
      title: 'Why Antimicrobial Resistance Needs a One Health Lens',
      slug: 'amr-one-health-perspective',
      excerpt: 'Resistance does not respect borders between clinics, farms and rivers.',
      content: 'Antimicrobial resistance (AMR) is one of the clearest examples of why microbiology cannot be studied in isolation.\n\n## The problem\n\nResistant strains emerging in clinical settings are frequently linked to environmental reservoirs.\n\n## What One Health changes\n\n- Surveillance across human, animal and environmental sectors\n- Shared diagnostics and open data standards\n- Stewardship programmes that span disciplines',
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
      content: 'Moving between molecular biology labs and public-health classrooms reshaped how I think about evidence.\n\n## Bench skills travel further than you expect\n\nPrecision, documentation and reproducibility matter equally in epidemiology.',
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
    await putList('blog_posts', sampleBlogPosts);

  // Media library
  const sampleMedia = [
    {
      filename: 'hero.jpg',
      originalName: 'hero.jpg',
      mimeType: 'image/jpeg',
      size: 94215,
      url: '/images/hero.jpg',
      altText: 'Working at the Bunsen burner in the microbiology lab',
      category: 'site',
    },
  ];
  await putList('media', sampleMedia);

  // Admin user
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);
  await wrappedDb.collection('users').insertOne(
    withTimestamps({
      email: env.ADMIN_EMAIL,
      name: env.ADMIN_NAME,
      role: 'admin',
      passwordHash,
      tokenVersion: 0,
    })
  );
  logger.info(`Admin user created: ${env.ADMIN_EMAIL}`);

  // Seed CV file record
  const fs = await import('fs');
  const path = await import('path');
  const cvSource = path.join(process.cwd(), 'Dipesh Thapa CV.pdf');
  if (fs.existsSync(cvSource)) {
    const uploadsDir = path.isAbsolute(env.UPLOAD_DIR) ? env.UPLOAD_DIR : path.join(process.cwd(), env.UPLOAD_DIR);
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const storedName = 'Dipesh-Thapa-CV.pdf';
    const dest = path.join(uploadsDir, storedName);
    if (!fs.existsSync(dest)) fs.copyFileSync(cvSource, dest);
    await wrappedDb.collection('cv_files').insertOne(
      withTimestamps({
        filename: storedName,
        originalName: 'Dipesh Thapa CV.pdf',
        label: 'Curriculum Vitae',
        size: fs.statSync(cvSource).size,
        mimeType: 'application/pdf',
        isPublic: true,
        active: true,
        notes: 'Bundled CV.',
      })
    );
  }

  logger.info('Auto-seed completed successfully.');
};

export const checkDatabaseHealth = async (): Promise<{ ok: boolean; collections?: string[]; error?: string }> => {
  if (degraded || !wrappedDb) {
    await ensureSeeded();
    return { ok: false, error: 'MongoDB not connected â€” serving bundled seed data from memory.' };
  }
  try {
    const collections = await Promise.race([
      wrappedDb.listCollections(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Health check timed out after ${HEALTH_TIMEOUT_MS}ms`)), HEALTH_TIMEOUT_MS)
      ),
    ]);
    return { ok: true, collections: collections.map((c) => c.name) };
  } catch (error) {
    degraded = true;
    await ensureSeeded();
    return { ok: false, error: `${String(error)} (serving in-memory seed data)` };
  }
};

export const isDegraded = (): boolean => degraded;

export const closeDatabase = async (): Promise<void> => {
  if (client) {
    await client.close();
    client = null;
    cachedDb = null;
    wrappedDb = null;
  }
};
