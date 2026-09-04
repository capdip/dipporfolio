import { useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAllRecords, useCreateRecord, useDeleteRecord, usePatchRecord, useReorderRecords, useUpdateRecord } from '../../hooks/useContent';
import { ApiError } from '../../lib/api';
import { cn } from '../../lib/cn';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import {
  CheckboxInput,
  ConfirmButton,
  Drawer,
  FormField,
  ImagePickerInput,
  InlineBanner,
  PageHeader,
  SelectInput,
  TagsInput,
  TextArea,
  TextInput,
  useAutoDismissBanner,
} from './ui';
import { resourceSchemas, type FieldDef } from './resourceSchemas';

type AdminRecord = Record<string, unknown> & { _id?: string };

interface LinkRow {
  label: string;
  url: string;
}

interface CtaRow {
  label: string;
  url: string;
  style: string;
}

const emptyDefault = (field: FieldDef): unknown => {
  switch (field.type) {
    case 'checkbox':
      return field.name === 'visibility';
    case 'number':
      return '';
    case 'tags':
      return [];
    case 'links':
    case 'ctas':
      return [];
    case 'daterange':
      return { start: '', end: '' };
    case 'select':
      return field.options?.[0] ?? '';
    default:
      return '';
  }
};

const buildInitialValues = (record: AdminRecord | null, fields: FieldDef[]): Record<string, unknown> => {
  const values: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = record ? record[f.name] : undefined;
    if (raw !== undefined && raw !== null) values[f.name] = raw;
    else values[f.name] = emptyDefault(f);
  }
  return values;
};

const toPayload = (
  values: Record<string, unknown>,
  fields: FieldDef[],
  isEdit: boolean
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === 'number') {
      if (v === '' || v === null || v === undefined) {
        // Cleared number field: send null so the server unsets the old value.
        if (!f.required && isEdit) payload[f.name] = null;
        continue;
      }
      payload[f.name] = Number(v);
      continue;
    }
    if (f.type === 'daterange') {
      const dr = v as { start?: string; end?: string };
      if (!dr?.start) {
        // Cleared date range: send null so the server unsets the old value.
        if (!f.required) payload[f.name] = null;
        continue;
      }
      payload[f.name] = { start: dr.start, ...(dr.end ? { end: dr.end } : {}) };
      continue;
    }
    // IMPORTANT: empty strings must be SENT, not skipped. The server applies
    // updates with a $set merge, so omitted fields keep their previous value —
    // skipping cleared fields here made old content reappear after edits.
    // Optional string schemas on the server accept '' as a cleared value.
    if (typeof v === 'string' && v.trim() === '') {
      if (f.required) continue; // validated earlier; never overwrite required fields
      payload[f.name] = '';
      continue;
    }
    if (Array.isArray(v) && v.length === 0 && !['tags', 'links', 'ctas'].includes(f.type)) continue;
    payload[f.name] = v;
  }
  return payload;
};

const recordTitle = (record: AdminRecord): string => {
  for (const key of ['title', 'name', 'institution', 'organization', 'language', 'qualification']) {
    const v = record[key];
    if (typeof v === 'string' && v) return v;
  }
  return record._id ?? 'Untitled';
};

const LinksEditor = ({
  value,
  onChange,
}: {
  value: LinkRow[];
  onChange: (next: LinkRow[]) => void;
}) => (
  <div className="flex flex-col gap-2">
    {value.map((row, i) => (
      <div key={i} className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          aria-label={`Link ${i + 1} label`}
          value={row.label}
          placeholder="Label"
          className="min-w-0 flex-1"
          onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
        />
        <TextInput
          aria-label={`Link ${i + 1} URL`}
          value={row.url}
          placeholder="https://..."
          className="min-w-0 flex-1"
          onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
        />
        <button
          type="button"
          aria-label={`Remove link ${i + 1}`}
          onClick={() => onChange(value.filter((_, j) => j !== i))}
          className="shrink-0 self-start rounded-lg border border-danger/40 px-2.5 py-2 text-sm text-danger hover:bg-danger/10 sm:self-auto"
        >
          ×
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onChange([...value, { label: '', url: '' }])}
      className="self-start rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
    >
      + Add link
    </button>
  </div>
);

const CtasEditor = ({
  value,
  onChange,
}: {
  value: CtaRow[];
  onChange: (next: CtaRow[]) => void;
}) => (
  <div className="flex flex-col gap-2">
    {value.map((row, i) => (
      <div key={i} className="flex flex-col gap-2 sm:flex-row">
        <TextInput
          aria-label={`Button ${i + 1} label`}
          value={row.label}
          placeholder="Label"
          className="min-w-0 flex-1"
          onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))}
        />
        <TextInput
          aria-label={`Button ${i + 1} URL`}
          value={row.url}
          placeholder="/path or https://..."
          className="min-w-0 flex-1"
          onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, url: e.target.value } : r)))}
        />
        <SelectInput
          aria-label={`Button ${i + 1} style`}
          value={row.style}
          options={[
            { value: 'primary', label: 'Primary' },
            { value: 'secondary', label: 'Secondary' },
            { value: 'ghost', label: 'Ghost' },
          ]}
          className="sm:w-32"
          onChange={(e) => onChange(value.map((r, j) => (j === i ? { ...r, style: e.target.value } : r)))}
        />
        <button
          type="button"
          aria-label={`Remove button ${i + 1}`}
          onClick={() => onChange(value.filter((_, j) => j !== i))}
          className="shrink-0 self-start rounded-lg border border-danger/40 px-2.5 py-2 text-sm text-danger hover:bg-danger/10 sm:self-auto"
        >
          ×
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={() => onChange([...value, { label: '', url: '', style: 'primary' }])}
      className="self-start rounded-lg border border-border px-3 py-1.5 text-sm text-muted transition hover:text-foreground"
    >
      + Add button
    </button>
  </div>
);

const FieldControl = ({
  field,
  value,
  onChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (next: unknown) => void;
}) => {
  switch (field.type) {
    case 'textarea':
    case 'richtext':
      return (
        <TextArea
          id={`f-${field.name}`}
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'number':
      return (
        <TextInput
          id={`f-${field.name}`}
          type="number"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'date':
      return (
        <TextInput
          id={`f-${field.name}`}
          type="date"
          value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'checkbox':
      return (
        <CheckboxInput
          label={field.label}
          checked={Boolean(value)}
          onChange={(v) => onChange(v)}
        />
      );
    case 'select':
      return (
        <SelectInput
          id={`f-${field.name}`}
          value={String(value ?? '')}
          options={(field.options ?? []).map((o) => ({ value: o, label: o }))}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case 'tags':
      return (
        <TagsInput
          id={`f-${field.name}`}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={(v) => onChange(v)}
          placeholder={field.placeholder}
        />
      );
    case 'image':
      return (
        <ImagePickerInput
          id={`f-${field.name}`}
          value={String(value ?? '')}
          onChange={(v) => onChange(v)}
        />
      );
    case 'links':
      return (
        <LinksEditor
          value={Array.isArray(value) ? (value as LinkRow[]) : []}
          onChange={(v) => onChange(v)}
        />
      );
    case 'ctas':
      return (
        <CtasEditor
          value={Array.isArray(value) ? (value as CtaRow[]) : []}
          onChange={(v) => onChange(v)}
        />
      );
    case 'daterange': {
      const dr = (value as { start?: string; end?: string }) ?? { start: '', end: '' };
      return (
        <div className="flex flex-col gap-2 sm:flex-row">
          <TextInput
            aria-label={`${field.label} start`}
            type="date"
            value={dr.start ?? ''}
            onChange={(e) => onChange({ ...dr, start: e.target.value })}
          />
          <TextInput
            aria-label={`${field.label} end`}
            type="date"
            value={dr.end ?? ''}
            onChange={(e) => onChange({ ...dr, end: e.target.value })}
          />
        </div>
      );
    }
    default:
      return (
        <TextInput
          id={`f-${field.name}`}
          value={String(value ?? '')}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
};

export default function ResourceManager() {
  const { resource = '' } = useParams<{ resource: string }>();
  const schema = resourceSchemas[resource];
  const { banner, setBanner } = useAutoDismissBanner();
  const [search, setSearch] = useState('');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);

  const listQuery = useAllRecords<AdminRecord>(resource);
  const createMutation = useCreateRecord<AdminRecord>(resource);
  const updateMutation = useUpdateRecord<AdminRecord>(resource);
  const patchMutation = usePatchRecord(resource);
  const deleteMutation = useDeleteRecord(resource);
  const reorderMutation = useReorderRecords(resource);

  const records = listQuery.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q || !schema) return records;
    const searchable = schema.fields.filter((f) =>
      ['text', 'textarea', 'richtext', 'select'].includes(f.type)
    );
    return records.filter((r) =>
      searchable.some((f) => String(r[f.name] ?? '').toLowerCase().includes(q))
    );
  }, [records, search, schema]);

  if (!schema) {
    return (
      <div>
        <PageHeader title="Unknown resource" />
        <ErrorState message={`No schema is registered for "${resource}".`} />
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setValues(buildInitialValues(null, schema.fields));
    setFormError(null);
    setEditorOpen(true);
  };

  const openEdit = (record: AdminRecord) => {
    setEditing(record);
    setValues(buildInitialValues(record, schema.fields));
    setFormError(null);
    setEditorOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    const missing = schema.fields.find(
      (f) => f.required && (values[f.name] === '' || values[f.name] === null || values[f.name] === undefined ||
        (Array.isArray(values[f.name]) && (values[f.name] as unknown[]).length === 0))
    );
    if (missing) {
      setFormError(`"${missing.label}" is required.`);
      return;
    }
    const payload = toPayload(values, schema.fields, Boolean(editing?._id));
    try {
      if (editing?._id) {
        await updateMutation.mutateAsync({ id: editing._id, payload });
        setBanner({ tone: 'success', message: `${schema.singularLabel} updated.` });
      } else {
        await createMutation.mutateAsync(payload);
        setBanner({ tone: 'success', message: `${schema.singularLabel} created.` });
      }
      setEditorOpen(false);
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Failed to save. Please try again.');
    }
  };

  const toggleVisibility = (record: AdminRecord) => {
    if (!record._id) return;

    // Handle different visibility field names based on resource type.
    // Uses PATCH (partial update) so we don't re-validate the full schema.
    let payload: Record<string, unknown>;
    if (resource === 'recommendations') {
      // `visibility` is the canonical flag; keep `publicVisibility` in sync so
      // the public section and any legacy UI agree on whether to show the item.
      const next = !(record.visibility ?? record.publicVisibility ?? true);
      payload = { visibility: next, publicVisibility: next };
    } else if (resource === 'blog') {
      payload = { status: record.status === 'published' ? 'draft' : 'published' };
    } else {
      payload = { visibility: record.visibility !== false };
    }

    patchMutation.mutate(
      { id: record._id, payload },
      {
        onError: (err) =>
          setBanner({
            tone: 'error',
            message: err instanceof ApiError ? err.message : 'Failed to update visibility.',
          }),
      }
    );
  };

  const handleDrop = (targetIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;
    const ids = filtered.map((r) => r._id).filter((x): x is string => Boolean(x));
    if (ids.length !== filtered.length) return;
    const [moved] = ids.splice(from, 1);
    ids.splice(targetIndex, 0, moved);
    reorderMutation.mutate(ids, {
      onError: (err) =>
        setBanner({
          tone: 'error',
          message: err instanceof ApiError ? err.message : 'Failed to reorder.',
        }),
    });
  };

  const busy = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <PageHeader
        title={schema.label}
        description={`${records.length} record${records.length === 1 ? '' : 's'} · drag rows to reorder`}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
          >
            + New {schema.singularLabel}
          </button>
        }
      />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="mb-4">
        <TextInput
          type="search"
          aria-label={`Search ${schema.label}`}
          placeholder={`Search ${schema.label.toLowerCase()}…`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {listQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      ) : listQuery.isError ? (
        <ErrorState
          message={listQuery.error instanceof ApiError ? listQuery.error.message : 'Failed to load records.'}
          onRetry={() => void listQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          message={search ? `No ${schema.label.toLowerCase()} match your search.` : `No ${schema.label.toLowerCase()} yet.`}
          hint={search ? undefined : `Click "+ New ${schema.singularLabel}" to add the first one.`}
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {filtered.map((record, index) => (
            <li
              key={record._id ?? index}
              draggable
              onDragStart={() => {
                dragIndex.current = index;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(index)}
              className="panel flex cursor-grab items-center gap-3 px-4 py-3 active:cursor-grabbing"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="h-5 w-5 shrink-0 text-faint"
                fill="currentColor"
              >
                <circle cx="9" cy="6" r="1.5" />
                <circle cx="15" cy="6" r="1.5" />
                <circle cx="9" cy="12" r="1.5" />
                <circle cx="15" cy="12" r="1.5" />
                <circle cx="9" cy="18" r="1.5" />
                <circle cx="15" cy="18" r="1.5" />
              </svg>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {recordTitle(record)}
              </span>
              {record.featured === true ? (
                <span className="hidden rounded-full bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning sm:inline">
                  Featured
                </span>
              ) : null}
              <button
                type="button"
                aria-label={record.visibility === false ? `Show ${recordTitle(record)}` : `Hide ${recordTitle(record)}`}
                onClick={() => toggleVisibility(record)}
                className={cn(
                  'shrink-0 rounded-lg p-1.5 transition hover:bg-elevated',
                  record.visibility === false ? 'text-faint' : 'text-success'
                )}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  {record.visibility === false ? (
                    <>
                      <path d="M3 3l18 18" strokeLinecap="round" />
                      <path d="M10.6 10.6a2.5 2.5 0 003.5 3.5" />
                      <path d="M6.7 6.8C4.6 8 3 10 2 12c1.8 3.5 5.5 6 10 6 1.6 0 3.1-.3 4.5-.9M17.9 17c1.5-.9 2.8-2.1 3.8-3.6a13.4 13.4 0 00-6.2-5.3" />
                    </>
                  ) : (
                    <>
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
                      <circle cx="12" cy="12" r="2.5" />
                    </>
                  )}
                </svg>
              </button>
              <button
                type="button"
                aria-label={`Edit ${recordTitle(record)}`}
                onClick={() => openEdit(record)}
                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 20h4L19.5 8.5a2.1 2.1 0 00-3-3L5 17v3z" strokeLinejoin="round" />
                </svg>
              </button>
              <ConfirmButton
                ariaLabel={`Delete ${recordTitle(record)}`}
                confirmMessage={`Delete "${recordTitle(record)}"? This cannot be undone.`}
                onConfirm={() => {
                  if (!record._id) return;
                  deleteMutation.mutate(record._id, {
                    onSuccess: () => setBanner({ tone: 'success', message: `${schema.singularLabel} deleted.` }),
                    onError: (err) =>
                      setBanner({
                        tone: 'error',
                        message: err instanceof ApiError ? err.message : 'Failed to delete.',
                      }),
                  });
                }}
                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-danger/10 hover:text-danger"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m-8 0l1 13h8l1-13" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ConfirmButton>
            </li>
          ))}
        </ul>
      )}

      <Drawer
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? `Edit ${schema.singularLabel}` : `New ${schema.singularLabel}`}
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditorOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSave()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
            >
              {busy ? 'Saving…' : editing ? 'Save changes' : 'Create'}
            </button>
          </div>
        }
      >
        {formError ? <InlineBanner tone="error" message={formError} onDismiss={() => setFormError(null)} /> : null}
        <div className="flex flex-col gap-4">
          {schema.fields.map((field) =>
            field.type === 'checkbox' ? (
              <FieldControl
                key={field.name}
                field={field}
                value={values[field.name]}
                onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
              />
            ) : (
              <FormField
                key={field.name}
                label={field.label}
                htmlFor={`f-${field.name}`}
                required={field.required}
                helpText={field.helpText}
              >
                <FieldControl
                  field={field}
                  value={values[field.name]}
                  onChange={(v) => setValues((prev) => ({ ...prev, [field.name]: v }))}
                />
              </FormField>
            )
          )}
        </div>
      </Drawer>
    </div>
  );
}
