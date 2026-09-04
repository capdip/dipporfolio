import { useEffect, useState } from 'react';
import { useSettings, useSaveSettings } from '../../hooks/useContent';
import { ApiError } from '../../lib/api';
import type { ThemeSettings } from '../../../../shared/types';
import { ErrorState, Skeleton } from '../ui/primitives';
import {
  FormField,
  InlineBanner,
  PageHeader,
  SelectInput,
  TextInput,
  useAutoDismissBanner,
} from './ui';

const DEFAULT_THEME: ThemeSettings = {
  defaultTheme: 'dark',
  accentColor: '#38bdf8',
  accentColorSecondary: '#a78bfa',
  fontFamilyHeading: 'Inter',
  fontFamilyBody: 'Inter',
  darkBackground: '#04070f',
  lightBackground: '#f7f9fc',
  radius: '0.75rem',
};

const RADIUS_OPTIONS = ['0', '0.25rem', '0.5rem', '0.75rem', '1rem', '1.5rem', '9999px'];

export default function ThemeEditor() {
  const settingsQuery = useSettings();
  const saveSettings = useSaveSettings();
  const { banner, setBanner } = useAutoDismissBanner();
  const [theme, setTheme] = useState<ThemeSettings>(DEFAULT_THEME);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (settingsQuery.data && !loaded) {
      setTheme({ ...DEFAULT_THEME, ...(settingsQuery.data.theme ?? {}) });
      setLoaded(true);
    }
  }, [settingsQuery.data, loaded]);

  // NOTE: no global CSS-variable mutation here — the ThemeApplier in
  // Providers.tsx owns :root theme variables so saved changes apply site-wide.

  if (settingsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Theme" />
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div>
        <PageHeader title="Theme" />
        <ErrorState
          message={settingsQuery.error instanceof ApiError ? settingsQuery.error.message : 'Failed to load theme.'}
          onRetry={() => void settingsQuery.refetch()}
        />
      </div>
    );
  }

  const patch = (p: Partial<ThemeSettings>) => setTheme((t) => ({ ...t, ...p }));

  const handleSave = () => {
    saveSettings.mutate(
      { ...(settingsQuery.data ?? {}), theme },
      {
        onSuccess: () => setBanner({ tone: 'success', message: 'Theme saved.' }),
        onError: (err) =>
          setBanner({
            tone: 'error',
            message: err instanceof ApiError ? err.message : 'Failed to save theme.',
          }),
      }
    );
  };

  return (
    <div>
      <PageHeader
        title="Theme"
        description="Accent colors, fonts and shape. Changes preview live."
        actions={
          <button
            type="button"
            disabled={saveSettings.isPending}
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            {saveSettings.isPending ? 'Saving…' : 'Save theme'}
          </button>
        }
      />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="panel grid gap-4 p-5 sm:grid-cols-2">
          <FormField label="Default theme" htmlFor="th-default">
            <SelectInput
              id="th-default"
              value={theme.defaultTheme}
              options={[
                { value: 'dark', label: 'Dark' },
                { value: 'light', label: 'Light' },
              ]}
              onChange={(e) => patch({ defaultTheme: e.target.value as ThemeSettings['defaultTheme'] })}
            />
          </FormField>
          <FormField label="Corner radius" htmlFor="th-radius">
            <SelectInput
              id="th-radius"
              value={theme.radius}
              options={RADIUS_OPTIONS.map((r) => ({ value: r, label: r }))}
              onChange={(e) => patch({ radius: e.target.value })}
            />
          </FormField>
          <FormField label="Accent color" htmlFor="th-accent">
            <div className="flex gap-2">
              <TextInput
                id="th-accent"
                type="color"
                value={theme.accentColor}
                onChange={(e) => patch({ accentColor: e.target.value })}
                className="h-10 w-16 cursor-pointer p-1"
              />
              <TextInput
                aria-label="Accent color hex"
                value={theme.accentColor}
                onChange={(e) => patch({ accentColor: e.target.value })}
              />
            </div>
          </FormField>
          <FormField label="Secondary accent color" htmlFor="th-accent2">
            <div className="flex gap-2">
              <TextInput
                id="th-accent2"
                type="color"
                value={theme.accentColorSecondary}
                onChange={(e) => patch({ accentColorSecondary: e.target.value })}
                className="h-10 w-16 cursor-pointer p-1"
              />
              <TextInput
                aria-label="Secondary accent color hex"
                value={theme.accentColorSecondary}
                onChange={(e) => patch({ accentColorSecondary: e.target.value })}
              />
            </div>
          </FormField>
          <FormField label="Heading font family" htmlFor="th-fh">
            <TextInput
              id="th-fh"
              value={theme.fontFamilyHeading}
              onChange={(e) => patch({ fontFamilyHeading: e.target.value })}
            />
          </FormField>
          <FormField label="Body font family" htmlFor="th-fb">
            <TextInput
              id="th-fb"
              value={theme.fontFamilyBody}
              onChange={(e) => patch({ fontFamilyBody: e.target.value })}
            />
          </FormField>
          <FormField label="Dark background" htmlFor="th-darkbg">
            <TextInput
              id="th-darkbg"
              value={theme.darkBackground}
              onChange={(e) => patch({ darkBackground: e.target.value })}
            />
          </FormField>
          <FormField label="Light background" htmlFor="th-lightbg">
            <TextInput
              id="th-lightbg"
              value={theme.lightBackground}
              onChange={(e) => patch({ lightBackground: e.target.value })}
            />
          </FormField>
        </div>

        <div className="panel flex flex-col items-center gap-4 p-6">
          <h2 className="self-start font-heading text-lg font-semibold text-foreground">Live preview</h2>
          <div
            className="w-full max-w-xs rounded-xl border border-border bg-surface p-4"
            style={{ borderRadius: theme.radius }}
          >
            <p className="font-heading text-xl font-bold text-foreground" style={{ fontFamily: `'${theme.fontFamilyHeading}', sans-serif` }}>
              Heading sample
            </p>
            <p className="mt-1 text-sm text-muted" style={{ fontFamily: `'${theme.fontFamilyBody}', sans-serif` }}>
              Body text preview with your chosen font.
            </p>
            <div className="mt-3 flex gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: theme.accentColor, borderRadius: theme.radius }}
              >
                Primary
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ backgroundColor: theme.accentColorSecondary, borderRadius: theme.radius }}
              >
                Accent
              </span>
            </div>
          </div>
          <div className="flex w-full justify-center gap-3 pt-2">
            {[theme.accentColor, theme.accentColorSecondary, theme.darkBackground, theme.lightBackground].map(
              (color, i) => (
                <span
                  key={`${color}-${i}`}
                  title={color}
                  aria-label={`Swatch ${color}`}
                  className="h-10 w-10 rounded-full border border-border"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
