import type { ZodType } from 'zod';
import { getDb } from '../db/database.js';
import { notFound } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

export interface ResourceConfig {
  /** Route mount path AND collection name, e.g. "publications". */
  name: string;
  /** Actual MongoDB collection name if different from `name`. */
  collectionName?: string;
  schema: ZodType;
  /** Mongo-style filter applied to public reads. */
  publicFilter?: Record<string, unknown>;
  /** Default sort applied to public reads. */
  sort?: Record<string, 1 | -1>;
  /** Fields searched when ?search= is provided. */
  searchFields?: string[];
}

type Doc = Record<string, unknown>;

const nowIso = () => new Date().toISOString();

const collection = (configOrName: ResourceConfig | string) => {
  const name = typeof configOrName === 'string' ? configOrName : (configOrName.collectionName ?? configOrName.name);
  return getDb().collection(name);
};

const nextOrder = async (config: ResourceConfig): Promise<number> => {
  const docs = await collection(config).find({}, { projection: { order: 1 }, limit: 1000 }).toArray();
  const max = docs.reduce((acc: number, d: Doc) => Math.max(acc, Number(d.order ?? -1)), -1);
  return max + 1;
};

const buildSearchFilter = (config: ResourceConfig, search: string): Doc | null => {
  if (!config.searchFields?.length || !search.trim()) return null;
  return {
    $or: config.searchFields.map((field) => ({
      [field]: { $regex: escapeRegex(search.trim()), $options: 'i' },
    })),
  };
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Public list: merges configured public filter + query filters. */
export const listRecords = async (
  config: ResourceConfig,
  query: Record<string, unknown>
): Promise<Doc[]> => {
  // Records without an explicit visibility field are considered public
  // (matches the client-side `visibility !== false` checks).
  const filter: Doc = { ...(config.publicFilter ?? { visibility: { $ne: false } }) };

  // Whitelisted equality filters from the querystring.
  const allowed = ['year', 'category', 'researchArea', 'publicationType', 'eventType', 'pageSlug'];
  for (const key of allowed) {
    const value = query[key];
    if (typeof value === 'string' && value.length > 0 && value !== 'all') {
      filter[key] = value;
    }
  }

  const search = typeof query.search === 'string' ? query.search : '';
  const searchFilter = buildSearchFilter(config, search);
  const finalFilter = searchFilter ? { $and: [filter, searchFilter] } : filter;

  const sort = config.sort ?? { order: 1 as const };
  const docs = await collection(config)
    .find(finalFilter, { sort })
    .limit(500)
    .toArray();
  return docs as Doc[];
};

/** Admin list (all records regardless of visibility). */
export const listAllRecords = async (config: ResourceConfig): Promise<Doc[]> => {
  const docs = await collection(config).find({}, { sort: config.sort ?? { order: 1 as const } }).limit(2000).toArray();
  return docs as Doc[];
};

export const getRecordById = async (config: ResourceConfig, id: string): Promise<Doc> => {
  const doc = (await collection(config).findOne({ _id: id })) as Doc | null;
  if (doc && isPubliclyVisible(config, doc)) return doc;
  // Fallback: blog posts are addressed by slug rather than _id.
  const bySlug = (await collection(config).findOne({ slug: id })) as Doc | null;
  if (bySlug && isPubliclyVisible(config, bySlug)) return bySlug;
  throw notFound(`${config.name} record not found`);
};

/**
 * A record is publicly visible when:
 * - It has no visibility flag, or visibility is true, AND
 * - For blog posts, its status is 'published' (not draft/hidden/archived).
 * Resources hidden via the admin "hide" toggle (visibility=false) or via
 * blog status (draft/hidden/archived) must NOT be accessible publicly.
 */
const isPubliclyVisible = (config: ResourceConfig, doc: Doc): boolean => {
  if (doc.visibility === false) return false;
  if (config.name === 'blog') {
    const status = doc.status;
    if (status && status !== 'published') return false;
  }
  return true;
};

export const createRecord = async (config: ResourceConfig, payload: unknown): Promise<Doc> => {
  const data = config.schema.parse(payload) as Doc;
  if (data.order === undefined || data.order === null) data.order = await nextOrder(config);
  data.createdAt = nowIso();
  data.updatedAt = nowIso();
  const result = await collection(config).insertOne(data);
  logger.info('Record created', { resource: config.name, id: String(result.insertedId) });
  return { ...data, _id: result.insertedId };
};

export const updateRecord = async (
  config: ResourceConfig,
  id: string,
  payload: unknown
): Promise<Doc> => {
  const data = config.schema.parse(payload) as Doc;
  delete data._id;
  delete data.createdAt;
  data.updatedAt = nowIso();
  // Fields explicitly set to null mean "clear this field" — they must be
  // $unset rather than $set, otherwise old values persist on the record.
  const set: Doc = {};
  const unset: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null) unset[key] = '';
    else set[key] = value;
  }
  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;
  const result = await collection(config).findOneAndUpdate(
    { _id: id },
    update,
    { returnDocument: 'after' }
  );
  if (!result) throw notFound(`${config.name} record not found`);
  logger.info('Record updated', { resource: config.name, id });
  return result as Doc;
};

export const patchRecord = async (
  config: ResourceConfig,
  id: string,
  partial: Doc
): Promise<Doc | null> => {
  delete partial._id;
  delete partial.createdAt;
  partial.updatedAt = nowIso();
  const set: Doc = {};
  const unset: Record<string, string> = {};
  for (const [key, value] of Object.entries(partial)) {
    if (value === null) unset[key] = '';
    else set[key] = value;
  }
  const update: Record<string, unknown> = { $set: set };
  if (Object.keys(unset).length > 0) update.$unset = unset;
  const result = await collection(config).findOneAndUpdate(
    { _id: id },
    update,
    { returnDocument: 'after' }
  );
  return (result as Doc) ?? null;
};

export const deleteRecord = async (config: ResourceConfig, id: string): Promise<boolean> => {
  const result = await collection(config).deleteOne({ _id: id });
  if (result.deletedCount === 0) throw notFound(`${config.name} record not found`);
  logger.info('Record deleted', { resource: config.name, id });
  return true;
};

export const reorderRecords = async (config: ResourceConfig, ids: string[]): Promise<number> => {
  let updated = 0;
  for (let index = 0; index < ids.length; index++) {
    const result = await collection(config).updateOne(
      { _id: ids[index] },
      { $set: { order: index, updatedAt: nowIso() } }
    );
    updated += result.modifiedCount ?? 0;
  }
  logger.info('Records reordered', { resource: config.name, count: updated });
  return updated;
};
