import { describe, expect, it, beforeEach } from 'vitest';
import { memDb } from '../server/src/db/memory-backend';
import {
  createRecord,
  listRecords,
  listAllRecords,
  getRecordById,
  updateRecord,
  patchRecord,
  deleteRecord,
  reorderRecords,
  type ResourceConfig,
} from '../server/src/services/collection.service';
import { educationSchema, publicationSchema, blogPostSchema, researchSchema } from '../server/src/validation/schemas.js';

const educationConfig: ResourceConfig = {
  name: 'test_education',
  schema: educationSchema,
  sort: { order: 1 },
  searchFields: ['institution', 'qualification'],
};

const publicationConfig: ResourceConfig = {
  name: 'test_publications',
  schema: publicationSchema,
  publicFilter: { visibility: true },
  sort: { order: 1 },
  searchFields: ['title', 'authors'],
};

const blogConfig: ResourceConfig = {
  name: 'test_blog',
  schema: blogPostSchema,
  publicFilter: { status: 'published' },
  sort: { publicationDate: -1 as const },
  searchFields: ['title', 'tags'],
};

const researchConfig: ResourceConfig = {
  name: 'test_research',
  schema: researchSchema,
  // Mirrors the production research resource: default visibility filter and
  // order-based sort (no explicit `sort`/`publicFilter`).
  sort: { order: 1 },
  publicFilter: { visibility: { $ne: false } },
  searchFields: ['title', 'organization', 'institution'],
};

beforeEach(async () => {
  // Clear the test collections in the shared memDb singleton
    memDb.collection('test_education').docs.clear();
  memDb.collection('test_publications').docs.clear();
  memDb.collection('test_blog').docs.clear();
  memDb.collection('test_research').docs.clear();

  const eduCol = memDb.collection('test_education');
  await eduCol.insertOne({
    _id: 'edu-1',
    institution: 'University of Europe',
    qualification: 'Master in Public Health',
    startDate: '2025',
    endDate: '2026',
    location: 'Germany',
    visibility: true,
    order: 0,
  });
  await eduCol.insertOne({
    _id: 'edu-2',
    institution: 'Tribhuvan University',
    qualification: 'M.Sc. Biotechnology',
    startDate: '2019',
    endDate: '2024',
    location: 'Nepal',
    visibility: true,
    order: 1,
  });
  await eduCol.insertOne({
    _id: 'edu-hidden',
    institution: 'Hidden University',
    qualification: 'Secret Degree',
    startDate: '2020',
    visibility: false,
    order: 2,
  });

  const pubCol = memDb.collection('test_publications');
  await pubCol.insertOne({
    _id: 'pub-1',
    title: 'AMR in Nepal',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Thesis',
    visibility: true,
    order: 0,
  });
  await pubCol.insertOne({
    _id: 'pub-2',
    title: 'Public Health Migration',
    authors: ['Dipesh Thapa'],
    year: '2026',
    publicationType: 'Online resource',
    visibility: true,
    order: 1,
  });

  const blogCol = memDb.collection('test_blog');
  await blogCol.insertOne({
    _id: 'blog-1',
    title: 'AMR One Health',
    slug: 'amr-one-health',
    content: 'Body text about AMR',
    status: 'published',
    visibility: true,
    order: 0,
  });
    await blogCol.insertOne({
    _id: 'blog-2',
    title: 'Draft Post',
    slug: 'draft-post',
    content: 'Draft content',
    status: 'draft',
    visibility: true,
    order: 1,
  });

  const resCol = memDb.collection('test_research');
  await resCol.insertOne({
    _id: 'res-1',
    title: 'Project A',
    shortDescription: 'desc A',
    image: '/u/a.png',
    keywords: ['k1'],
    visibility: true,
    order: 0,
  });
  await resCol.insertOne({
    _id: 'res-2',
    title: 'Project B',
    shortDescription: 'desc B',
    keywords: [],
    visibility: true,
    order: 1,
  });
  await resCol.insertOne({
    _id: 'res-3',
    title: 'Project C',
    visibility: false,
    order: 2,
  });
});

describe('listRecords', () => {
  it('returns visible records only', async () => {
    const records = await listRecords(educationConfig, {});
    expect(records.length).toBe(2);
    expect(records.every((r) => r.visibility === true)).toBe(true);
  });

  it('filters by year for publications', async () => {
    const records = await listRecords(publicationConfig, { year: '2026' });
    expect(records.length).toBe(2);
  });

  it('searches by title', async () => {
    const records = await listRecords(publicationConfig, { search: 'AMR' });
    expect(records.length).toBe(1);
    expect(records[0].title).toContain('AMR');
  });

  it('returns blog posts with status filter', async () => {
    const records = await listRecords(blogConfig, {});
    expect(records.length).toBe(1);
    expect(records[0].status).toBe('published');
  });
});

describe('listAllRecords', () => {
  it('returns all records including hidden', async () => {
    const records = await listAllRecords(educationConfig);
    expect(records.length).toBe(3);
  });
});

describe('getRecordById', () => {
  it('returns record by _id', async () => {
    const record = await getRecordById(educationConfig, 'edu-1');
    expect(record.institution).toBe('University of Europe');
  });

  it('returns blog post by slug', async () => {
    const record = await getRecordById(blogConfig, 'amr-one-health');
    expect(record.title).toBe('AMR One Health');
  });

  it('throws for missing record', async () => {
    await expect(getRecordById(educationConfig, 'nonexistent')).rejects.toThrow();
  });

  it('throws for hidden records', async () => {
    await expect(getRecordById(educationConfig, 'edu-hidden')).rejects.toThrow();
  });
});

describe('createRecord', () => {
  it('creates and returns new record', async () => {
    const record = await createRecord(educationConfig, {
      institution: 'New University',
      qualification: 'B.Sc.',
      startDate: '2023',
    });
    expect(record._id).toBeTruthy();
    expect(record.institution).toBe('New University');
    expect(record.createdAt).toBeTruthy();
  });

  it('rejects invalid data', async () => {
    await expect(createRecord(educationConfig, { qualification: 'X' })).rejects.toThrow();
  });
});

describe('updateRecord', () => {
  it('updates an existing record', async () => {
    const record = await updateRecord(educationConfig, 'edu-1', {
      institution: 'Updated University',
      qualification: 'Master in Public Health',
      startDate: '2025',
    });
    expect(record.institution).toBe('Updated University');
  });

  it('throws for nonexistent record', async () => {
    await expect(updateRecord(educationConfig, 'nonexistent', {
      institution: 'X',
      qualification: 'Y',
      startDate: '2020',
    })).rejects.toThrow();
  });

  it('clears optional string fields sent as empty strings', async () => {
    const record = await updateRecord(educationConfig, 'edu-1', {
      institution: 'University of Europe',
      qualification: 'Master in Public Health',
      startDate: '2025',
      location: '',
      description: '',
    });
    // Cleared values must NOT keep their old content ($set merge regression).
    expect(record.location).toBe('');
    expect(record.description).toBe('');
  });

  it('removes fields sent as null (client sends null for cleared numbers/dates)', async () => {
    const record = await updateRecord(educationConfig, 'edu-1', {
      institution: 'University of Europe',
      qualification: 'Master in Public Health',
      startDate: '2025',
      order: null,
    });
    expect('order' in record).toBe(false);
  });
});

describe('patchRecord', () => {
  it('partially updates a record', async () => {
    const record = await patchRecord(educationConfig, 'edu-1', { location: 'Berlin, Germany' });
    expect(record).not.toBeNull();
    expect(record!.location).toBe('Berlin, Germany');
    expect(record!.institution).toBe('University of Europe');
  });

  it('removes fields patched as null', async () => {
    await patchRecord(educationConfig, 'edu-1', { location: null });
    const record = await getRecordById(educationConfig, 'edu-1');
    expect('location' in record).toBe(false);
  });

  it('returns null for nonexistent record', async () => {
    const record = await patchRecord(educationConfig, 'nonexistent', { x: 1 });
    expect(record).toBeNull();
  });
});

describe('deleteRecord', () => {
  it('deletes an existing record', async () => {
    const result = await deleteRecord(educationConfig, 'edu-1');
    expect(result).toBe(true);
    await expect(getRecordById(educationConfig, 'edu-1')).rejects.toThrow();
  });

  it('throws for nonexistent record', async () => {
    await expect(deleteRecord(educationConfig, 'nonexistent')).rejects.toThrow();
  });
});

describe('reorderRecords', () => {
  it('updates order fields', async () => {
    const count = await reorderRecords(educationConfig, ['edu-2', 'edu-1', 'edu-hidden']);
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

describe('research resource', () => {
  it('lists only visible research sorted by order', async () => {
    const records = await listRecords(researchConfig, {});
    // res-3 is visibility:false -> hidden on the public site.
    expect(records.length).toBe(2);
    expect(records.map((r) => r.title)).toEqual(['Project A', 'Project B']);
  });

  it('persists edits and reflects them on the public list', async () => {
    const updated = await updateRecord(researchConfig, 'res-1', {
      title: 'Project A',
      shortDescription: 'updated desc',
      keywords: ['new'],
      image: '/u/a.png',
    });
    expect(updated.shortDescription).toBe('updated desc');
    expect(updated.keywords).toEqual(['new']);

    const listed = await listRecords(researchConfig, {});
    const a = listed.find((r) => r._id === 'res-1');
    expect(a?.shortDescription).toBe('updated desc');
    expect(a?.keywords).toEqual(['new']);
  });

  it('creates a record and reflects it on the public list', async () => {
    const created = await createRecord(researchConfig, { title: 'Project D' });
    expect(created.title).toBe('Project D');
    expect(created.order).toBe(3);

    const listed = await listRecords(researchConfig, {});
    expect(listed.find((r) => r._id === created._id)).toBeTruthy();
  });

  it('reorders records and reflects the new order on the public list', async () => {
    await reorderRecords(researchConfig, ['res-2', 'res-1', 'res-3']);
    const records = await listRecords(researchConfig, {});
    expect(records.map((r) => r.title)).toEqual(['Project B', 'Project A']);

    const all = await listAllRecords(researchConfig);
    const byId = Object.fromEntries(all.map((r) => [r._id, r]));
    expect(byId['res-2'].order).toBe(0);
    expect(byId['res-1'].order).toBe(1);
    expect(byId['res-3'].order).toBe(2);
  });
});
