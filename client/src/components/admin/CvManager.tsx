import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { keys, useCvVersions } from '../../hooks/useContent';
import type { CvFile } from '../../../../shared/types';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import {
  CheckboxInput,
  ConfirmButton,
  FormField,
  InlineBanner,
  PageHeader,
  TextArea,
  TextInput,
  useAutoDismissBanner,
} from './ui';

export default function CvManager() {
  const { banner, setBanner } = useAutoDismissBanner();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [notes, setNotes] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Same-origin: frontend and API are served by the same Vercel deployment.
  const API_BASE_URL = '/api';

  useEffect(() => {
    const url = API_BASE_URL + '/cv/download';
    setDownloadUrl(url);
  }, []);

  const versionsQuery = useCvVersions();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: keys.cv });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error('No file selected');
      return api.uploadCv(file, { label: label.trim() || 'CV', isPublic, notes: notes || undefined });
    },
    onSuccess: () => {
      invalidate();
      setFile(null);
      setLabel('');
      setNotes('');
      setBanner({ tone: 'success', message: 'CV uploaded.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Upload failed.',
      }),
  });

  const patchMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch('cv', id, payload),
    onSuccess: (_data, variables) => {
      invalidate();
      if (variables.payload.active === true) {
        setBanner({ tone: 'success', message: 'Active CV updated.' });
      }
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Update failed.',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove('cv', id),
    onSuccess: () => {
      invalidate();
      setBanner({ tone: 'success', message: 'CV version deleted.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Delete failed.',
      }),
  });

  return (
    <div>
      <PageHeader title="CV Manager" description="Upload CV versions and control which one is public." />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="panel mb-6 grid gap-4 p-5 md:grid-cols-2">
        <FormField label="PDF file" htmlFor="cv-file" required>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              id="cv-file"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
            >
              Choose PDF
            </button>
            <span className="truncate text-sm text-muted">{file?.name ?? 'No file selected'}</span>
          </div>
        </FormField>
        <FormField label="Label" htmlFor="cv-label" helpText="Shown on the site, e.g. “Academic CV 2026”">
          <TextInput id="cv-label" value={label} onChange={(e) => setLabel(e.target.value)} />
        </FormField>
        <FormField label="Notes" htmlFor="cv-notes" className="md:col-span-2">
          <TextArea id="cv-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <div className="flex items-center gap-4 md:col-span-2">
          <CheckboxInput label="Publicly downloadable" checked={isPublic} onChange={setIsPublic} />
          <button
            type="button"
            disabled={!file || uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="ml-auto rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            {uploadMutation.isPending ? 'Uploading…' : 'Upload & activate'}
          </button>
        </div>
      </div>

      {versionsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : versionsQuery.isError ? (
        <ErrorState
          message={
            versionsQuery.error instanceof ApiError ? versionsQuery.error.message : 'Failed to load CV versions.'
          }
          onRetry={() => void versionsQuery.refetch()}
        />
      ) : (versionsQuery.data ?? []).length === 0 ? (
        <EmptyState message="No CV versions yet." hint="Upload your first PDF above." />
      ) : (
        <ul className="flex flex-col gap-3">
          {(versionsQuery.data ?? []).map((cv) => (
            <CvRow
              key={cv._id}
              cv={cv}
              downloadUrl={downloadUrl}
              onPatch={(payload) => cv._id && patchMutation.mutate({ id: cv._id, payload })}
              onDelete={() => cv._id && deleteMutation.mutate(cv._id)}
              busy={patchMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const CvRow = ({
  cv,
  downloadUrl,
  onPatch,
  onDelete,
  busy,
}: {
  cv: CvFile;
  downloadUrl: string;
  onPatch: (payload: Record<string, unknown>) => void;
  onDelete: () => void;
  busy: boolean;
}) => {
  const [label, setLabel] = useState(cv.label);
  const [notes, setNotes] = useState(cv.notes ?? '');

  return (
    <li
      className={`panel flex flex-col gap-3 p-4 ${cv.active ? 'border-primary/50' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-foreground">{cv.label}</p>
          <p className="text-xs text-faint">
            {cv.originalName} · {(cv.size / 1024 / 1024).toFixed(2)} MB ·{' '}
            {cv.createdAt ? new Date(cv.createdAt).toLocaleDateString() : ''}
          </p>
        </div>
        {cv.active ? (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">Active</span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onPatch({ active: true })}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:border-primary/40 hover:text-primary disabled:opacity-50"
          >
            Set active
          </button>
        )}
        <CheckboxInput
          label="Public"
          checked={cv.isPublic}
          onChange={(v) => onPatch({ isPublic: v })}
        />
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          Download
        </a>
        <ConfirmButton
          ariaLabel={`Delete ${cv.label}`}
          confirmMessage={`Delete "${cv.label}"? The file will be removed from disk.`}
          onConfirm={onDelete}
          className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
        >
          Delete
        </ConfirmButton>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="Label" htmlFor={`cv-label-${cv._id}`}>
          <TextInput id={`cv-label-${cv._id}`} value={label} onChange={(e) => setLabel(e.target.value)} />
        </FormField>
        <FormField label="Notes" htmlFor={`cv-notes-${cv._id}`}>
          <TextInput id={`cv-notes-${cv._id}`} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
      </div>
      <button
        type="button"
        disabled={busy || (label === cv.label && notes === (cv.notes ?? ''))}
        onClick={() => onPatch({ label, notes })}
        className="self-start rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:opacity-40 dark:text-slate-900"
      >
        Save details
      </button>
    </li>
  );
};
