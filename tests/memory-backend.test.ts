import { describe, expect, it, beforeEach } from 'vitest';
import { MemDb, MemCollection } from '../server/src/db/memory-backend';

describe('MemDb', () => {
  let db: MemDb;

  beforeEach(() => {
    db = new MemDb();
  });

  it('creates collections on demand', () => {
    const col = db.collection('test');
    expect(col).toBeInstanceOf(MemCollection);
    expect(col.name).toBe('test');
  });

  it('returns same collection for same name', () => {
    const a = db.collection('x');
    const b = db.collection('x');
    expect(a).toBe(b);
  });

  it('lists collections', async () => {
    db.collection('alpha');
    db.collection('beta');
    const list = await db.listCollections();
    expect(list.map((c) => c.name)).toContain('alpha');
    expect(list.map((c) => c.name)).toContain('beta');
  });
});

describe('MemCollection CRUD', () => {
  let col: MemCollection;

  beforeEach(() => {
    const db = new MemDb();
    col = db.collection('items');
  });

  it('insertOne returns insertedId', async () => {
    const result = await col.insertOne({ name: 'A', value: 1 });
    expect(result.insertedId).toBeTruthy();
    expect(typeof result.insertedId).toBe('string');
  });

  it('findOne retrieves by _id', async () => {
    const { insertedId } = await col.insertOne({ name: 'B' });
    const doc = await col.findOne({ _id: insertedId });
    expect(doc).not.toBeNull();
    expect(doc!.name).toBe('B');
  });

  it('findOne returns null for missing doc', async () => {
    const doc = await col.findOne({ _id: 'nonexistent' });
    expect(doc).toBeNull();
  });

  it('find returns all docs with empty filter', async () => {
    await col.insertOne({ name: 'A' });
    await col.insertOne({ name: 'B' });
    const docs = await col.find({}).toArray();
    expect(docs.length).toBe(2);
  });

  it('find with equality filter', async () => {
    await col.insertOne({ name: 'A', status: 'active' });
    await col.insertOne({ name: 'B', status: 'inactive' });
    const docs = await col.find({ status: 'active' }).toArray();
    expect(docs.length).toBe(1);
    expect(docs[0].name).toBe('A');
  });

  it('find with $regex filter', async () => {
    await col.insertOne({ title: 'AMR in Nepal' });
    await col.insertOne({ title: 'Public Health' });
    const docs = await col.find({ title: { $regex: 'AMR', $options: 'i' } }).toArray();
    expect(docs.length).toBe(1);
  });

  it('find with $or filter', async () => {
    await col.insertOne({ name: 'A', type: 'x' });
    await col.insertOne({ name: 'B', type: 'y' });
    await col.insertOne({ name: 'C', type: 'z' });
    const docs = await col.find({ $or: [{ name: 'A' }, { name: 'C' }] }).toArray();
    expect(docs.length).toBe(2);
  });

  it('find supports sort and limit', async () => {
    await col.insertOne({ order: 3 });
    await col.insertOne({ order: 1 });
    await col.insertOne({ order: 2 });
    const docs = await col.find({}, { sort: { order: 1 }, limit: 2 }).toArray();
    expect(docs.length).toBe(2);
    expect(docs[0].order).toBe(1);
    expect(docs[1].order).toBe(2);
  });

  it('updateOne modifies matched doc', async () => {
    const { insertedId } = await col.insertOne({ name: 'Original' });
    const result = await col.updateOne({ _id: insertedId }, { $set: { name: 'Updated' } });
    expect(result.modifiedCount).toBe(1);
    const doc = await col.findOne({ _id: insertedId });
    expect(doc!.name).toBe('Updated');
  });

  it('updateOne returns 0 for no match', async () => {
    const result = await col.updateOne({ _id: 'none' }, { $set: { x: 1 } });
    expect(result.modifiedCount).toBe(0);
  });

  it('findOneAndUpdate returns updated doc', async () => {
    const { insertedId } = await col.insertOne({ count: 0 });
    const result = await col.findOneAndUpdate(
      { _id: insertedId },
      { $set: { count: 1 } },
      { returnDocument: 'after' }
    );
    expect(result).not.toBeNull();
    expect(result!.count).toBe(1);
  });

  it('findOneAndUpdate with upsert creates doc', async () => {
    const result = await col.findOneAndUpdate(
      { _id: 'new-id' },
      { $set: { name: 'Created' } },
      { upsert: true }
    );
    expect(result).not.toBeNull();
    const doc = await col.findOne({ _id: 'new-id' });
    expect(doc!.name).toBe('Created');
  });

  it('deleteOne removes matched doc', async () => {
    const { insertedId } = await col.insertOne({ name: 'Delete Me' });
    const result = await col.deleteOne({ _id: insertedId });
    expect(result.deletedCount).toBe(1);
    const doc = await col.findOne({ _id: insertedId });
    expect(doc).toBeNull();
  });

  it('deleteOne returns 0 for no match', async () => {
    const result = await col.deleteOne({ _id: 'none' });
    expect(result.deletedCount).toBe(0);
  });

  it('countDocuments returns size', async () => {
    expect(col.countDocuments()).toBe(0);
    await col.insertOne({ a: 1 });
    await col.insertOne({ a: 2 });
    expect(col.countDocuments()).toBe(2);
  });

  it('find with projection returns only projected fields', async () => {
    await col.insertOne({ name: 'A', secret: 'hidden', visible: true });
    const docs = await col.find({}, { projection: { name: 1, visible: 1 } }).toArray();
    expect(docs[0].name).toBe('A');
    expect(docs[0].visible).toBe(true);
    expect(docs[0].secret).toBeUndefined();
  });

  it('insertMany inserts multiple docs', async () => {
    const result = await col.insertMany([{ a: 1 }, { a: 2 }, { a: 3 }]);
    expect(result.insertedIds.length).toBe(3);
    expect(col.countDocuments()).toBe(3);
  });

  it('updateMany updates all matching docs', async () => {
    await col.insertOne({ status: 'draft', x: 1 });
    await col.insertOne({ status: 'draft', x: 2 });
    await col.insertOne({ status: 'published', x: 3 });
    const result = await col.updateMany({ status: 'draft' }, { $set: { status: 'published' } });
    expect(result.modifiedCount).toBe(2);
  });
});
