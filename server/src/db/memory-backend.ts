/**
 * Minimal in-memory backend implementing the subset of the Astra DB
 * collection API the server uses. Activated automatically when the real
 * database is unreachable (e.g. missing credentials in development), so the
 * whole site keeps working against bundled seed data.
 */

type Doc = Record<string, unknown>;

export interface FindOptions {
  sort?: Record<string, 1 | -1>;
  limit?: number;
  projection?: Record<string, unknown>;
}

const matches = (doc: Doc, filter: Doc): boolean => {
  for (const [key, condition] of Object.entries(filter)) {
    if (key === '$and') {
      const parts = condition as Doc[];
      if (!parts.every((p) => matches(doc, p))) return false;
      continue;
    }
    if (key === '$or') {
      const parts = condition as Doc[];
      if (!parts.some((p) => matches(doc, p))) return false;
      continue;
    }
    const value = doc[key];
    if (
      condition !== null &&
      typeof condition === 'object' &&
      !Array.isArray(condition)
    ) {
      const cond = condition as Record<string, unknown>;
      if ('$regex' in cond) {
        const flags = (cond.$options as string | undefined) ?? '';
        const rx = new RegExp(cond.$regex as string, flags);
        if (typeof value !== 'string' || !rx.test(value)) return false;
        continue;
      }
      if ('$ne' in cond && value === cond.$ne) return false;
      if ('$in' in cond && !(cond.$in as unknown[]).includes(value)) return false;
      continue;
    }
    if (value !== condition) return false;
  }
  return true;
};

const project = (doc: Doc, projection?: FindOptions['projection']): Doc => {
  if (!projection) return { ...doc };
  const entries = Object.entries(projection);
  // MongoDB supports inclusion projections ({ field: 1 }) and exclusion ({ field: 0 }).
  // If any value is falsy, treat the whole projection as an exclusion set.
  const excludes = entries.some(([, include]) => !include);
  if (excludes) {
    const blocked = new Set(entries.filter(([, include]) => !include).map(([key]) => key));
    const out: Doc = {};
    for (const [key, value] of Object.entries(doc)) {
      if (!blocked.has(key)) out[key] = value;
    }
    return out;
  }
  const out: Doc = {};
  for (const [field, include] of entries) {
    if (include) out[field] = doc[field];
  }
  return out;
};

const compare = (a: unknown, b: unknown): number => {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b));
};

let idCounter = 0;
const generateId = (): string =>
  `mem_${Date.now().toString(36)}_${(++idCounter).toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

class MemFindCursor {
  constructor(
    private docs: Doc[],
    private options: FindOptions
  ) {}

  sort(spec: Record<string, 1 | -1>): this {
    const entries = Object.entries(spec);
    this.docs.sort((a, b) => {
      for (const [field, dir] of entries) {
        const result = compare(a[field], b[field]);
        if (result !== 0) return dir === 1 ? result : -result;
      }
      return 0;
    });
    return this;
  }

  limit(n: number): this {
    this.docs = this.docs.slice(0, n);
    return this;
  }

  async toArray(): Promise<Doc[]> {
    const { projection } = this.options;
    return this.docs.map((d) => project(d, projection));
  }
}

export class MemCollection {
  readonly docs = new Map<string, Doc>();

  constructor(readonly name: string) {}

  private all(): Doc[] {
    return Array.from(this.docs.values());
  }

  find(filter: Doc = {}, options: FindOptions = {}): MemFindCursor {
    const found = filter && Object.keys(filter).length > 0 ? this.all().filter((d) => matches(d, filter)) : this.all();
    const cursor = new MemFindCursor([...found], options);
    if (options.sort) cursor.sort(options.sort);
    if (options.limit !== undefined) cursor.limit(options.limit);
    return cursor;
  }

  async findOne(filter: Doc = {}): Promise<Doc | null> {
    return this.all().find((d) => matches(d, filter)) ?? null;
  }

  async insertOne(doc: Doc): Promise<{ insertedId: string }> {
    const _id = String(doc._id ?? generateId());
    this.docs.set(_id, { ...doc, _id });
    return { insertedId: _id };
  }

  async insertMany(docs: Doc[]): Promise<{ insertedIds: string[] }> {
    const ids: string[] = [];
    for (const doc of docs) ids.push((await this.insertOne(doc)).insertedId);
    return { insertedIds: ids };
  }

  async updateOne(filter: Doc, update: { $set?: Doc; $unset?: Doc }): Promise<{ modifiedCount: number }> {
    const doc = this.all().find((d) => matches(d, filter));
    if (!doc) return { modifiedCount: 0 };
    this.applyUpdate(doc, update);
    return { modifiedCount: 1 };
  }

  async updateMany(filter: Doc, update: { $set?: Doc; $unset?: Doc }): Promise<{ modifiedCount: number }> {
    let count = 0;
    for (const doc of this.all().filter((d) => matches(d, filter))) {
      this.applyUpdate(doc, update);
      count++;
    }
    return { modifiedCount: count };
  }

  async findOneAndUpdate(
    filter: Doc,
    update: { $set?: Doc; $setOnInsert?: Doc; $unset?: Doc },
    options: { returnDocument?: string; upsert?: boolean } = {}
  ): Promise<Doc | null> {
    const doc = this.all().find((d) => matches(d, filter));
    if (doc) {
      this.applyUpdate(doc, update);
      return options.returnDocument === 'before' ? { ...doc } : { ...doc };
    }
    if (options.upsert) {
      const created = { ...(update.$setOnInsert ?? {}), ...(update.$set ?? {}), ...(filter._id ? { _id: filter._id } : {}) };
      const id = (await this.insertOne(created)).insertedId;
      return { ...this.docs.get(id)! };
    }
    return null;
  }

  /** Mimics Mongo's $set/$unset update operators. */
  private applyUpdate(doc: Doc, update: { $set?: Doc; $unset?: Doc }): void {
    if (update.$set) Object.assign(doc, update.$set);
    if (update.$unset) {
      for (const key of Object.keys(update.$unset)) delete doc[key];
    }
  }

  async deleteOne(filter: Doc): Promise<{ deletedCount: number }> {
    const doc = this.all().find((d) => matches(d, filter));
    if (!doc) return { deletedCount: 0 };
    this.docs.delete(String(doc._id));
    return { deletedCount: 1 };
  }

  countDocuments(): number {
    return this.docs.size;
  }
}

export class MemDb {
  private readonly collections = new Map<string, MemCollection>();

  collection(name: string): MemCollection {
    let col = this.collections.get(name);
    if (!col) {
      col = new MemCollection(name);
      this.collections.set(name, col);
    }
    return col;
  }

  async listCollections(): Promise<Array<{ name: string }>> {
    return Array.from(this.collections.keys()).map((name) => ({ name }));
  }
}

export const memDb = new MemDb();
