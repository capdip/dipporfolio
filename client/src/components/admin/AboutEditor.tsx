import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { keys, useAbout, useSettings } from '../../hooks/useContent';
import { resolveImageUrl } from '../../lib/resolveImageUrl';
import type { MediaItem } from '../../../../shared/types';
import { ErrorState, Skeleton } from '../ui/primitives';
import { InlineBanner, PageHeader, TextArea, TextInput, useAutoDismissBanner } from './ui';

const parseKeywords = (raw: string): string[] =>
  raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);

export default function AboutEditor() {
  const { banner, setBanner } = useAutoDismissBanner();
  const queryClient = useQueryClient();
  const aboutQuery = useAbout();
  const settingsQuery = useSettings();

  const [description, setDescription] = useState('');
  const [keywordsRaw, setKeywordsRaw] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [profileImage, setProfileImage] = useState('');

  // Use refs to always have current values in mutations (avoids stale closures)
  const descRef = useRef(description);
  const keywordsRef = useRef(keywordsRaw);
  const nameRef = useRef(name);
  const titleRef = useRef(title);
  const photosRef = useRef(photos);
  const profileRef = useRef(profileImage);

  useEffect(() => { descRef.current = description; }, [description]);
  useEffect(() => { keywordsRef.current = keywordsRaw; }, [keywordsRaw]);
  useEffect(() => { nameRef.current = name; }, [name]);
  useEffect(() => { titleRef.current = title; }, [title]);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  useEffect(() => { profileRef.current = profileImage; }, [profileImage]);

  useEffect(() => {
    if (aboutQuery.data) {
      setDescription(aboutQuery.data.profileText ?? '');
      setKeywordsRaw((aboutQuery.data.keywords ?? []).join(', '));
      setPhotos(aboutQuery.data.images ?? []);
      setProfileImage(aboutQuery.data.profileImage ?? '');
    }
  }, [aboutQuery.data]);

  useEffect(() => {
    if (settingsQuery.data) {
      setName(settingsQuery.data.footer?.name ?? '');
      setTitle(settingsQuery.data.footer?.professionalTitle ?? '');
    }
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async (overrides?: { images?: string[]; profileImage?: string }) => {
      const finalImages = overrides?.images ?? photosRef.current;
      const finalProfile = overrides?.profileImage ?? profileRef.current;
      // Merge with the existing about doc so unrelated fields (biography,
      // highlights, related links, cta…) are preserved instead of wiped.
      await api.saveAbout({
        ...(aboutQuery.data ?? {}),
        profileText: descRef.current.trim(),
        keywords: parseKeywords(keywordsRef.current),
        images: finalImages.filter((p) => p.trim()),
        profileImage: finalProfile.trim(),
      });
      // Name / title live in site settings (footer). Send the full settings doc
      // because the API replaces it — a partial body would wipe other fields.
      await api.saveSettings({
        ...(settingsQuery.data ?? {}),
        footer: { ...(settingsQuery.data?.footer ?? {}), name: nameRef.current.trim(), professionalTitle: titleRef.current.trim() },
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: keys.about });
      void queryClient.invalidateQueries({ queryKey: keys.settings });
      setBanner({ tone: 'success', message: 'About section saved.' });
    },
    onError: (err) => {
      console.error('Save error:', err);
      setBanner({ tone: 'error', message: err instanceof Error ? err.message : 'Save failed.' });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: (files: FileList) =>
      Promise.all(
        Array.from(files).map((file) => api.uploadMedia(file, { category: 'about', altText: file.name }))
      ),
    onSuccess: (media: MediaItem[]) => {
      const next = [...photosRef.current, ...media.map((m) => m.url)];
      photosRef.current = next;
      setPhotos(next);
      saveMutation.mutate({ images: next });
      setBanner({ tone: 'success', message: `${media.length} photo(s) uploaded and saved.` });
    },
    onError: (err) => {
      console.error('Upload error:', err);
      setBanner({ tone: 'error', message: err instanceof Error ? err.message : 'Upload failed.' });
    },
  });

  const removePhoto = (index: number) => {
    const next = photos.filter((_, i) => i !== index);
    setPhotos(next);
    // Update ref immediately so the mutation uses the latest value
    photosRef.current = next;
    saveMutation.mutate({ images: next });
  };

  const loading = aboutQuery.isLoading || settingsQuery.isLoading;

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (aboutQuery.isError) {
    return <ErrorState message="Failed to load about content." onRetry={() => void aboutQuery.refetch()} />;
  }

  return (
    <div>
      <PageHeader
        title="About Section"
        description="Update your name, title, description and keywords. Saving replaces any previous about content on the site."
        actions={
          <button
            type="button"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate({})}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            {saveMutation.isPending ? 'Saving...' : 'Save changes'}
          </button>
        }
      />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="panel space-y-5 p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="about-name" className="mb-1.5 block text-sm font-medium text-foreground">Name</label>
            <TextInput id="about-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Dipesh Thapa" />
          </div>
          <div>
            <label htmlFor="about-title" className="mb-1.5 block text-sm font-medium text-foreground">Professional Title</label>
            <TextInput
              id="about-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Research Scientist & Molecular Biologist"
            />
          </div>
        </div>
        <div>
          <label htmlFor="about-description" className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
          <TextArea
            id="about-description"
            rows={8}
            placeholder="Tell visitors about yourself..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="about-keywords" className="mb-1.5 block text-sm font-medium text-foreground">Keywords</label>
          <TextInput
            id="about-keywords"
            value={keywordsRaw}
            onChange={(e) => setKeywordsRaw(e.target.value)}
            placeholder="Molecular Biology, Public Health, Antimicrobial Resistance"
          />
          <p className="mt-1.5 text-xs text-faint">Separate keywords with commas.</p>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">Profile Image (fallback — shown only if no photos above)</span>
          <div className="flex flex-wrap items-center gap-2">
            {profileImage ? (
              <img src={resolveImageUrl(profileImage)} alt="Profile" className="h-10 w-14 rounded border border-border object-cover" />
            ) : null}
            <TextInput
              value={profileImage}
              onChange={(e) => {
                setProfileImage(e.target.value);
                // Auto-save on change for immediate feedback
                saveMutation.mutate({});
              }}
              placeholder="Image URL (leave empty for none)"
              className="min-w-0 flex-1"
            />
            <button
              type="button"
              onClick={() => {
                setProfileImage('');
                profileRef.current = '';
                saveMutation.mutate({ profileImage: '' });
              }}
              className="shrink-0 rounded-lg border border-danger/40 px-3 py-2 text-xs font-medium text-danger transition hover:bg-danger/10"
            >
              Delete image
            </button>
          </div>
          <p className="mt-1.5 text-xs text-faint">
            This image is shown as a fallback when no photos are added below.
          </p>
        </div>
        <div>
          <span className="mb-1.5 block text-sm font-medium text-foreground">Photos (slider on About page)</span>
          <div className="flex flex-col gap-2">
            {photos.map((photo, index) => (
              <div key={photo + index} className="flex flex-wrap items-center gap-2">
                <img src={resolveImageUrl(photo)} alt={`Photo ${index + 1}`} className="h-10 w-14 rounded border border-border object-cover" />
                <TextInput
                  value={photo}
                  onChange={(e) => setPhotos((prev) => prev.map((p, i) => (i === index ? e.target.value : p)))}
                  onBlur={() => saveMutation.mutate({})}
                  className="min-w-0 flex-1"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="shrink-0 rounded-lg border border-danger/40 px-2 py-2 text-xs text-danger transition hover:bg-danger/10"
                >
                  Remove
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <TextInput
                value={newPhotoUrl}
                onChange={(e) => setNewPhotoUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (newPhotoUrl.trim()) {
                      const next = [...photosRef.current, newPhotoUrl.trim()];
                      photosRef.current = next;
                      setPhotos(next);
                      setNewPhotoUrl('');
                      saveMutation.mutate({ images: next });
                    }
                  }
                }}
                placeholder="Paste an image URL and press Add"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPhotoUrl.trim()) {
                    const next = [...photosRef.current, newPhotoUrl.trim()];
                    photosRef.current = next;
                    setPhotos(next);
                    setNewPhotoUrl('');
                    saveMutation.mutate({ images: next });
                  }
                }}
                className="shrink-0 rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground"
              >
                Add
              </button>
              <label className="shrink-0 cursor-pointer rounded-lg border border-border px-3 py-2 text-sm font-medium text-muted transition hover:text-foreground">
                {uploadMutation.isPending ? 'Uploading...' : 'Upload photos'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) uploadMutation.mutate(e.target.files);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-faint">
              Upload multiple photos from your computer or paste image URLs. They appear as a slider on the About page.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
