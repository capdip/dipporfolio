import { useRef, useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';
import { useAllRecords, useMedia } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import type { BlogPost, MediaItem } from '../../../../shared/types';
import { EmptyState, ErrorState, Skeleton } from '../ui/primitives';
import {
  CheckboxInput,
  ConfirmButton,
  Drawer,
  FormField,
  InlineBanner,
  PageHeader,
  SelectInput,
  TextArea,
  TextInput,
  useAutoDismissBanner,
} from './ui';
import RichTextEditor from './RichTextEditor';



const emptyPost = (): Partial<BlogPost> => ({
  title: '',
  subtitle: '',
  slug: '',
  author: '',
  content: '',
  excerpt: '',
  category: '',
  tags: [],
  status: 'draft',
  featured: false,
  contentFont: 'Merriweather',
  publicationDate: new Date().toISOString().split('T')[0],
});

const FONT_OPTIONS = [
  { value: 'Merriweather', label: 'Merriweather (Serif)' },
  { value: 'Playfair Display', label: 'Playfair Display (Elegant)' },
  { value: 'Lora', label: 'Lora (Serif)' },
  { value: 'Inter', label: 'Inter (Modern Sans)' },
  { value: 'Roboto', label: 'Roboto (Clean Sans)' },
  { value: 'Source Serif 4', label: 'Source Serif 4 (Serif)' },
  { value: 'EB Garamond', label: 'EB Garamond (Classic)' },
  { value: 'Crimson Text', label: 'Crimson Text (Book)' },
  { value: 'Nunito', label: 'Nunito (Rounded Sans)' },
  { value: 'Montserrat', label: 'Montserrat (Geometric)' },
];

// Google Fonts that need to be loaded dynamically
const GOOGLE_FONTS = [
  'Merriweather',
  'Playfair Display',
  'Lora',
  'Inter',
  'Roboto',
  'Source Serif 4',
  'EB Garamond',
  'Crimson Text',
  'Nunito',
  'Montserrat',
];

/** Load Google Fonts dynamically */
function loadGoogleFont(fontName: string) {
  if (!GOOGLE_FONTS.includes(fontName)) return;
  const linkId = `google-font-${fontName.replace(/\s+/g, '-').toLowerCase()}`;
  if (document.getElementById(linkId)) return;
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName).replace(/%20/g, '+')}:ital,wght@0,400;0,700;1,400;1,700&display=swap`;
  document.head.appendChild(link);
}

// Preload all Google Fonts on module load
if (typeof window !== 'undefined') {
  GOOGLE_FONTS.forEach(loadGoogleFont);
}

const STORAGE_KEY = 'blog_editor_draft';

/** Save draft to sessionStorage */
function saveDraft(values: Partial<BlogPost>, editingId: string | null) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ values, editingId }));
  } catch {
    /* ignore */
  }
}

/** Load draft from sessionStorage */
function loadDraft(): { values: Partial<BlogPost>; editingId: string | null } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/** Clear draft from sessionStorage */
function clearDraft() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Sanitize a string into a valid URL slug */
function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-')      // Collapse multiple hyphens
    .replace(/^-|-$/g, '');   // Remove leading/trailing hyphens
}

/** Auto-generate a slug from a title */
function generateSlug(title: string): string {
  return sanitizeSlug(title).slice(0, 80);
}

export default function BlogEditor() {
  const { banner, setBanner } = useAutoDismissBanner();
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [values, setValues] = useState<Partial<BlogPost>>(emptyPost());
  const [formError, setFormError] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'coverImage' | 'featuredImage'>('coverImage');
  const postsQuery = useAllRecords<BlogPost>('blog');

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && draft.values?.content) {
      setValues(draft.values);
      setEditingId(draft.editingId);
      setEditorOpen(true);
    }
  }, []);

  // Auto-save draft to sessionStorage when values change
  useEffect(() => {
    if (values.content || values.title) {
      saveDraft(values, editingId);
    }
  }, [values, editingId]);

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['resource', 'blog', 'all'] });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<BlogPost>) => api.create<BlogPost>('blog', payload),
    onSuccess: () => {
      invalidate();
      setEditorOpen(false);
      clearDraft();
      setValues(emptyPost());
      setEditingId(null);
      setBanner({ tone: 'success', message: 'Blog post created.' });
    },
    onError: (err) =>
      setFormError(err instanceof ApiError ? err.message : 'Failed to save blog post.'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<BlogPost> }) =>
      api.update<BlogPost>('blog', id, payload),
    onSuccess: () => {
      invalidate();
      setEditorOpen(false);
      clearDraft();
      setValues(emptyPost());
      setEditingId(null);
      setBanner({ tone: 'success', message: 'Blog post updated.' });
    },
    onError: (err) =>
      setFormError(err instanceof ApiError ? err.message : 'Failed to save blog post.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.remove('blog', id),
    onSuccess: () => {
      invalidate();
      setBanner({ tone: 'success', message: 'Blog post deleted.' });
    },
    onError: (err) =>
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Delete failed.',
      }),
  });

  const uploadImageMutation = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append('file', file);
      form.append('metadata', JSON.stringify({ category: 'blog', altText: file.name }));
      return api.uploadMedia(file, { category: 'blog', altText: file.name });
    },
    onSuccess: (media: MediaItem) => {
      setValues((v) => ({ ...v, [mediaPickerTarget]: media.url }));
      setMediaPickerOpen(false);
      setBanner({ tone: 'success', message: 'Image uploaded and set.' });
    },
    onError: (err) =>
      setBanner({ tone: 'error', message: err instanceof ApiError ? err.message : 'Image upload failed.' }),
  });

  const openCreate = () => {
    setEditingId(null);
    setValues(emptyPost());
    setFormError(null);
    setTagInput('');
    clearDraft();
    setEditorOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditingId(post._id ?? null);
    setValues({ ...post });
    setFormError(null);
    setTagInput('');
    // Clear any existing draft when opening a fresh edit
    clearDraft();
    setEditorOpen(true);
  };

  const handleSave = async () => {
    setFormError(null);
    if (!values.title?.trim() || !values.slug?.trim() || !values.content?.trim()) {
      setFormError('Title, slug, and content are required.');
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(values.slug ?? '')) {
      setFormError('Slug must be lowercase kebab-case (e.g., my-blog-post).');
      return;
    }
    const payload: Partial<BlogPost> = {
      title: values.title.trim(),
      subtitle: values.subtitle?.trim(),
      slug: values.slug.trim(),
      author: values.author?.trim(),
      content: values.content.trim(),
      excerpt: values.excerpt?.trim(),
      category: values.category?.trim(),
      tags: values.tags ?? [],
      status: values.status ?? 'draft',
      featured: values.featured ?? false,
      publicationDate: values.publicationDate,
      coverImage: values.coverImage,
      featuredImage: values.featuredImage,
      contentFont: values.contentFont ?? 'Inter',
    };
    try {
      if (editingId) await updateMutation.mutateAsync({ id: editingId, payload });
      else await createMutation.mutateAsync(payload);
    } catch {
      setFormError('Failed to save blog post.');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !values.tags?.includes(tagInput.trim())) {
      setValues((v) => ({ ...v, tags: [...(v.tags ?? []), tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setValues((v) => ({ ...v, tags: (v.tags ?? []).filter((t) => t !== tag) }));
  };

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadImageMutation.mutate(file);
    e.target.value = '';
  };

  const openMediaPicker = (target: 'coverImage' | 'featuredImage') => {
    setMediaPickerTarget(target);
    setMediaPickerOpen(true);
  };

  const busy = createMutation.isPending || updateMutation.isPending;
  const posts = postsQuery.data ?? [];

  return (
    <div>
      <PageHeader
        title="Blog Posts"
        description="Manage blog posts and articles."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong dark:text-slate-900"
          >
            + New post
          </button>
        }
      />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      {postsQuery.isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : postsQuery.isError ? (
        <ErrorState
          message={postsQuery.error instanceof ApiError ? postsQuery.error.message : 'Failed to load blog posts.'}
          onRetry={() => void postsQuery.refetch()}
        />
      ) : posts.length === 0 ? (
        <EmptyState message="No blog posts yet." hint="Create your first blog post." />
      ) : (
        <ul className="flex flex-col gap-2">
          {posts.map((post) => (
            <li key={post._id} className="panel flex items-center gap-3 px-4 py-3">
              {post.coverImage ? (
                <img src={resolveImageUrl(post.coverImage)} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
              ) : null}
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{post.title}</span>
                <span className="text-xs text-faint">
                  {post.slug} · {post.status} · {post.category || 'Uncategorized'}
                </span>
              </span>
              {post.featured && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Featured</span>
              )}
              {post.status === 'hidden' && (
                <span className="rounded-full bg-warning/10 px-2 py-0.5 text-xs font-semibold text-warning">Hidden</span>
              )}
              <a
                href={`/blog/${post.slug}`}
                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
                title="Preview on site"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </a>
              <button
                type="button"
                aria-label={`Edit ${post.title}`}
                onClick={() => openEdit(post)}
                className="shrink-0 rounded-lg p-1.5 text-muted transition hover:bg-elevated hover:text-primary"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M4 20h4L19.5 8.5a2.1 2.1 0 00-3-3L5 17v3z" strokeLinejoin="round" />
                </svg>
              </button>
              <ConfirmButton
                ariaLabel={`Delete ${post.title}`}
                confirmMessage={`Delete "${post.title}"?`}
                onConfirm={() => post._id && deleteMutation.mutate(post._id)}
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
        title={editingId ? 'Edit blog post' : 'New blog post'}
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
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create'}
            </button>
          </div>
        }
      >
        {formError ? <InlineBanner tone="error" message={formError} onDismiss={() => setFormError(null)} /> : null}
        <div className="flex flex-col gap-4">
          <FormField label="Title" htmlFor="bl-title" required>
            <TextInput
              id="bl-title"
              value={values.title ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
            />
          </FormField>
          <FormField label="Subtitle" htmlFor="bl-subtitle">
            <TextInput
              id="bl-subtitle"
              value={values.subtitle ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, subtitle: e.target.value }))}
            />
          </FormField>
          <FormField label="Slug" htmlFor="bl-slug" required helpText="URL-friendly identifier (kebab-case). Auto-generated from title or type manually.">
            <div className="flex gap-2">
              <TextInput
                id="bl-slug"
                value={values.slug ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, slug: sanitizeSlug(e.target.value) }))}
                placeholder="my-blog-post"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => {
                  if (values.title?.trim()) {
                    setValues((v) => ({ ...v, slug: generateSlug(v.title ?? '') }));
                  }
                }}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
                title="Generate slug from title"
              >
                Auto
              </button>
            </div>
          </FormField>
          <FormField label="Author" htmlFor="bl-author">
            <TextInput
              id="bl-author"
              value={values.author ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, author: e.target.value }))}
            />
          </FormField>
          <FormField label="Category" htmlFor="bl-category">
            <TextInput
              id="bl-category"
              value={values.category ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
            />
          </FormField>

          <FormField label="Cover Image" htmlFor="bl-cover" helpText="URL or upload from media library">
            <div className="flex gap-2">
              <TextInput
                id="bl-cover"
                value={values.coverImage ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, coverImage: e.target.value }))}
                placeholder="https://... or upload"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => openMediaPicker('coverImage')}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Browse
              </button>
              <label className="shrink-0 cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground">
                Upload
                <input type="file" accept="image/*" className="hidden" onChange={handleImageFileSelect} />
              </label>
            </div>
            {values.coverImage ? (
              <img src={resolveImageUrl(values.coverImage)} alt="Cover preview" className="mt-2 h-20 w-full rounded object-cover" />
            ) : null}
          </FormField>

          <FormField label="Featured Image" htmlFor="bl-featured" helpText="Used for social sharing (Open Graph)">
            <div className="flex gap-2">
              <TextInput
                id="bl-featured"
                value={values.featuredImage ?? ''}
                onChange={(e) => setValues((v) => ({ ...v, featuredImage: e.target.value }))}
                placeholder="https://... or upload"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => openMediaPicker('featuredImage')}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Browse
              </button>
            </div>
            {values.featuredImage ? (
              <img src={resolveImageUrl(values.featuredImage)} alt="Featured preview" className="mt-2 h-20 w-full rounded object-cover" />
            ) : null}
          </FormField>

          <FormField label="Publication date" htmlFor="bl-date">
            <TextInput
              id="bl-date"
              type="date"
              value={values.publicationDate ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, publicationDate: e.target.value }))}
            />
          </FormField>
          <FormField label="Status" htmlFor="bl-status">
            <SelectInput
              id="bl-status"
              value={values.status ?? 'draft'}
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
                { value: 'hidden', label: 'Hidden' },
                { value: 'archived', label: 'Archived' },
              ]}
              onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as BlogPost['status'] }))}
            />
          </FormField>
          <FormField label="Excerpt" htmlFor="bl-excerpt" helpText="Short description for listing pages">
            <TextArea
              id="bl-excerpt"
              rows={2}
              value={values.excerpt ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, excerpt: e.target.value }))}
            />
          </FormField>
          <FormField label="Content Font" htmlFor="bl-font">
            <SelectInput
              id="bl-font"
              value={values.contentFont ?? 'Inter'}
              options={FONT_OPTIONS}
              onChange={(e) => setValues((v) => ({ ...v, contentFont: e.target.value }))}
            />
          </FormField>
          <FormField label="Content" required helpText="Rich text editor with formatting toolbar. Supports Markdown syntax.">
            <RichTextEditor
              value={values.content ?? ''}
              onChange={(content) => setValues((v) => ({ ...v, content }))}
              placeholder="Write your blog post content here..."
            />
          </FormField>
          <FormField label="Tags" htmlFor="bl-tags">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <TextInput
                  id="bl-tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(values.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 rounded-full bg-elevated px-3 py-1 text-sm text-muted"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-muted hover:text-foreground"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </FormField>
          <CheckboxInput
            label="Featured post"
            checked={values.featured ?? false}
            onChange={(checked) => setValues((v) => ({ ...v, featured: checked }))}
          />
        </div>
      </Drawer>

      {mediaPickerOpen && (
        <MediaPickerModal
          onSelect={(url) => {
            setValues((v) => ({ ...v, [mediaPickerTarget]: url }));
            setMediaPickerOpen(false);
          }}
          onClose={() => setMediaPickerOpen(false)}
        />
      )}
    </div>
  );
}

function MediaPickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const { data: media, isLoading } = useMedia();
  const uploadRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadMedia(file, { category: 'blog', altText: file.name }),
    onSuccess: (item: MediaItem) => onSelect(item.url),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="panel max-h-[80vh] w-full max-w-2xl overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-lg font-semibold text-foreground">Select Image</h3>
          <button type="button" onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>
        <label className="mb-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted transition hover:text-foreground">
          Upload new image
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              e.target.value = '';
            }}
          />
        </label>
        {isLoading ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {(media ?? []).filter((m: MediaItem) => String(m.mimeType ?? '').startsWith('image/')).map((item: MediaItem) => (
              <button
                key={item._id}
                type="button"
                onClick={() => onSelect(item.url)}
                className="group relative overflow-hidden rounded-lg border border-border transition hover:border-primary"
              >
                <img src={resolveImageUrl(item.url)} alt={item.altText ?? item.originalName} className="h-24 w-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 transition group-hover:opacity-100">
                  {item.originalName}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
