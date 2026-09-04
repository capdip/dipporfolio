import { useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { useResource } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import type { MediaItem } from '../../../../shared/types';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import {
  ConfirmButton,
  FormField,
  InlineBanner,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
  useAutoDismissBanner,
} from './ui';

const CATEGORY_OPTIONS = ['all', 'profile', 'project', 'publication', 'general', 'certificate'];

export default function MediaLibrary() {
  const { banner, setBanner } = useAutoDismissBanner();
  const queryClient = useQueryClient();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [altText, setAltText] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState('general');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const mediaQuery = useResource<MediaItem>('media');

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['media'] });
    void queryClient.invalidateQueries({ queryKey: ['resource', 'media'] });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      api.uploadMedia(file, { altText, caption, category: uploadCategory }),
    onSuccess: () => {
      invalidate();
      setAltText('');
      setCaption('');
      setBanner({ tone: 'success', message: 'File uploaded.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Upload failed.',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch('media', id, payload),
    onSuccess: () => {
      invalidate();
      setBanner({ tone: 'success', message: 'Media updated.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Update failed.',
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove('media', id),
    onSuccess: () => {
      invalidate();
      setBanner({ tone: 'success', message: 'Media deleted.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Delete failed.',
      }),
  });

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    uploadMutation.mutate(files[0], { onSettled: () => setUploading(false) });
  };

  const items = mediaQuery.data ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((m) => {
      if (category !== 'all' && (m.category ?? 'general') !== category) return false;
      if (!q) return true;
      return `${m.originalName} ${m.altText ?? ''} ${m.caption ?? ''}`.toLowerCase().includes(q);
    });
  }, [items, category, search]);

  return (
    <div>
      <PageHeader title="Media Library" description="Upload and manage images and documents." />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`mb-6 rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        <p className="text-sm text-muted">Drag & drop a file here, or</p>
        <button
          type="button"
          disabled={uploading || uploadMutation.isPending}
          onClick={() => fileInputRef.current?.click()}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
        >
          {uploading || uploadMutation.isPending ? 'Uploading…' : 'Choose a file'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml,application/pdf"
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="mx-auto mt-4 grid max-w-lg gap-3 sm:grid-cols-3">
          <FormField label="Alt text" htmlFor="up-alt">
            <TextInput id="up-alt" value={altText} onChange={(e) => setAltText(e.target.value)} />
          </FormField>
          <FormField label="Category" htmlFor="up-cat">
            <SelectInput
              id="up-cat"
              value={uploadCategory}
              options={CATEGORY_OPTIONS.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))}
              onChange={(e) => setUploadCategory(e.target.value)}
            />
          </FormField>
          <FormField label="Caption" htmlFor="up-cap">
            <TextInput id="up-cap" value={caption} onChange={(e) => setCaption(e.target.value)} />
          </FormField>
        </div>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <TextInput
          type="search"
          aria-label="Search media"
          placeholder="Search files…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="sm:max-w-xs"
        />
        <SelectInput
          aria-label="Filter by category"
          value={category}
          options={CATEGORY_OPTIONS.map((c) => ({ value: c, label: c === 'all' ? 'All categories' : c }))}
          onChange={(e) => setCategory(e.target.value)}
          className="sm:max-w-[12rem]"
        />
      </div>

      {mediaQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-xl" />
          ))}
        </div>
      ) : mediaQuery.isError ? (
        <ErrorState
          message={mediaQuery.error instanceof ApiError ? mediaQuery.error.message : 'Failed to load media.'}
          onRetry={() => void mediaQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState message="No media found." hint="Upload a file to get started." />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MediaCard
              key={item._id}
              item={item}
              onSave={(payload) => item._id && updateMutation.mutate({ id: item._id, payload })}
              onDelete={() => item._id && deleteMutation.mutate(item._id)}
              saving={updateMutation.isPending}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

const MediaCard = ({
  item,
  onSave,
  onDelete,
  saving,
}: {
  item: MediaItem;
  onSave: (payload: Record<string, unknown>) => void;
  onDelete: () => void;
  saving: boolean;
}) => {
  const [altText, setAltText] = useState(item.altText ?? '');
  const [caption, setCaption] = useState(item.caption ?? '');
  const [cat, setCat] = useState(item.category ?? 'general');
  const dirty =
    altText !== (item.altText ?? '') || caption !== (item.caption ?? '') || cat !== (item.category ?? 'general');

  return (
    <li className="panel flex flex-col overflow-hidden p-0">
      <div className="aspect-video w-full overflow-hidden bg-elevated">
        {item.mimeType.startsWith('image/') ? (
          <img src={resolveImageUrl(item.url)} alt={item.altText ?? item.originalName} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-faint">
            {item.mimeType.replace('application/', '').toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="truncate text-xs font-medium text-muted" title={item.originalName}>
          {item.originalName}
        </p>
        <FormField label="Alt text" htmlFor={`alt-${item._id}`}>
          <TextInput id={`alt-${item._id}`} value={altText} onChange={(e) => setAltText(e.target.value)} />
        </FormField>
        <FormField label="Caption" htmlFor={`cap-${item._id}`}>
          <TextArea
            id={`cap-${item._id}`}
            rows={2}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </FormField>
        <FormField label="Category" htmlFor={`cat-${item._id}`}>
          <SelectInput
            id={`cat-${item._id}`}
            value={cat}
            options={CATEGORY_OPTIONS.filter((c) => c !== 'all').map((c) => ({ value: c, label: c }))}
            onChange={(e) => setCat(e.target.value)}
          />
        </FormField>
        <div className="mt-auto flex items-center gap-2 pt-1">
          <button
            type="button"
            disabled={!dirty || saving}
            onClick={() => onSave({ altText, caption, category: cat })}
            className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-strong disabled:opacity-40 dark:text-slate-900"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => void navigator.clipboard.writeText(item.url).catch(() => undefined)}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            Copy URL
          </button>
          <ConfirmButton
            ariaLabel={`Delete ${item.originalName}`}
            confirmMessage={`Delete "${item.originalName}"? The file will be removed from disk.`}
            onConfirm={onDelete}
            className="ml-auto rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger/10"
          >
            Delete
          </ConfirmButton>
        </div>
      </div>
    </li>
  );
};
