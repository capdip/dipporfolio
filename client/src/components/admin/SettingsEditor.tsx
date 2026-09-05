import { useEffect, useState } from 'react';
import { useSettings, useSaveSettings } from '../../hooks/useContent';
import { useAuth } from '../../context/Providers';
import { api, ApiError } from '../../lib/api';
import type { FooterSettings, SiteSettings, SocialLinks } from '../../../../shared/types';
import { ErrorState, Skeleton } from '../ui/primitives';
import {
  CheckboxInput,
  FormField,
  InlineBanner,
  PageHeader,
  TagsInput,
  TextArea,
  TextInput,
  useAutoDismissBanner,
} from './ui';

const SOCIAL_FIELDS: Array<{ key: keyof SocialLinks; label: string }> = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'researchGate', label: 'ResearchGate' },
  { key: 'figshare', label: 'Figshare' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'github', label: 'GitHub' },
  { key: 'twitter', label: 'Twitter / X' },
  { key: 'orcid', label: 'ORCID' },
  { key: 'scholar', label: 'Google Scholar' },
  { key: 'website', label: 'Website' },
];

export default function SettingsEditor() {
  const { user } = useAuth();
  const settingsQuery = useSettings();
  const saveSettings = useSaveSettings();
  const { banner, setBanner } = useAutoDismissBanner();
  const [values, setValues] = useState<Partial<SiteSettings>>({});
  const [loaded, setLoaded] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    if (settingsQuery.data && !loaded) {
      setValues({ ...settingsQuery.data });
      setLoaded(true);
    }
  }, [settingsQuery.data, loaded]);

  if (settingsQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Settings" />
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (settingsQuery.isError) {
    return (
      <div>
        <PageHeader title="Settings" />
        <ErrorState
          message={
            settingsQuery.error instanceof ApiError ? settingsQuery.error.message : 'Failed to load settings.'
          }
          onRetry={() => void settingsQuery.refetch()}
        />
      </div>
    );
  }

  const footer = (values.footer ?? {}) as FooterSettings;
  const social = (values.socialLinks ?? {}) as SocialLinks;
  const setFooter = (patch: Partial<FooterSettings>) =>
    setValues((v) => ({ ...v, footer: { ...footer, ...patch } }));
  const setSocial = (key: keyof SocialLinks, url: string) =>
    setValues((v) => ({ ...v, socialLinks: { ...social, [key]: url || undefined } }));

  const handleSave = () => {
    saveSettings.mutate(values, {
      onSuccess: () => setBanner({ tone: 'success', message: 'Settings saved.' }),
      onError: (err) =>
        setBanner({
          tone: 'error',
          message: err instanceof ApiError ? err.message : 'Failed to save settings.',
        }),
    });
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      setBanner({ tone: 'error', message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setBanner({ tone: 'error', message: 'Passwords do not match.' });
      return;
    }
    try {
      await api.updateUser(user?.id || '', { password: newPassword });
      setBanner({ tone: 'success', message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof ApiError ? err.message : 'Failed to update password.',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Global site configuration."
        actions={
          <button
            type="button"
            disabled={saveSettings.isPending}
            onClick={handleSave}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            {saveSettings.isPending ? 'Saving…' : 'Save settings'}
          </button>
        }
      />

      {banner ? <InlineBanner tone={banner.tone} message={banner.message} onDismiss={() => setBanner(null)} /> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="panel flex flex-col gap-4 p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">General</h2>
          <FormField label="Site name" htmlFor="st-name" required>
            <TextInput
              id="st-name"
              value={values.siteName ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, siteName: e.target.value }))}
            />
          </FormField>
          <FormField label="Site description" htmlFor="st-desc">
            <TextArea
              id="st-desc"
              rows={3}
              value={values.siteDescription ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, siteDescription: e.target.value }))}
            />
          </FormField>
          <FormField label="Site URL" htmlFor="st-url">
            <TextInput
              id="st-url"
              value={values.siteUrl ?? ''}
              placeholder="https://example.com"
              onChange={(e) => setValues((v) => ({ ...v, siteUrl: e.target.value }))}
            />
          </FormField>
          <FormField label="Contact email" htmlFor="st-email">
            <TextInput
              id="st-email"
              type="email"
              value={values.contactEmail ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, contactEmail: e.target.value }))}
            />
          </FormField>
          <FormField label="Contact purposes" htmlFor="st-purposes" helpText="Options offered in the contact form">
            <TagsInput
              id="st-purposes"
              value={values.contactPurposes ?? []}
              onChange={(next) => setValues((v) => ({ ...v, contactPurposes: next }))}
              placeholder="e.g. Collaboration"
            />
          </FormField>
          <CheckboxInput
            label="Reduce effects by default for visitors"
            checked={values.reducedEffectsDefault ?? false}
            onChange={(checked) => setValues((v) => ({ ...v, reducedEffectsDefault: checked }))}
          />
        </section>

        <section className="panel flex flex-col gap-4 p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Social links</h2>
          {SOCIAL_FIELDS.map(({ key, label }) => (
            <FormField key={key} label={label} htmlFor={`soc-${key}`}>
              <TextInput
                id={`soc-${key}`}
                value={social[key] ?? ''}
                onChange={(e) => setSocial(key, e.target.value)}
              />
            </FormField>
          ))}
        </section>

        <section className="panel flex flex-col gap-4 p-5 xl:col-span-2">
          <h2 className="font-heading text-lg font-semibold text-foreground">Footer</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <FormField label="Name" htmlFor="ft-name">
              <TextInput id="ft-name" value={footer.name ?? ''} onChange={(e) => setFooter({ name: e.target.value })} />
            </FormField>
            <FormField label="Professional title" htmlFor="ft-title">
              <TextInput
                id="ft-title"
                value={footer.professionalTitle ?? ''}
                onChange={(e) => setFooter({ professionalTitle: e.target.value })}
              />
            </FormField>
            <FormField label="Location" htmlFor="ft-loc">
              <TextInput
                id="ft-loc"
                value={footer.location ?? ''}
                onChange={(e) => setFooter({ location: e.target.value })}
              />
            </FormField>
            <FormField label="Email" htmlFor="ft-email">
              <TextInput
                id="ft-email"
                value={footer.email ?? ''}
                onChange={(e) => setFooter({ email: e.target.value })}
              />
            </FormField>
            <FormField label="Copyright line" htmlFor="ft-copy">
              <TextInput
                id="ft-copy"
                value={footer.copyright ?? ''}
                onChange={(e) => setFooter({ copyright: e.target.value })}
              />
            </FormField>
            <FormField label="Custom text" htmlFor="ft-text">
              <TextArea
                id="ft-text"
                rows={2}
                value={footer.customText ?? ''}
                onChange={(e) => setFooter({ customText: e.target.value })}
              />
            </FormField>
          </div>
          <div className="flex flex-wrap gap-6">
            <CheckboxInput
              label="Show navigation in footer"
              checked={footer.showNavigation ?? true}
              onChange={(checked) => setFooter({ showNavigation: checked })}
            />
            <CheckboxInput
              label="Show social links in footer"
              checked={footer.showSocial ?? true}
              onChange={(checked) => setFooter({ showSocial: checked })}
            />
          </div>
        </section>

        <section className="panel flex flex-col gap-4 p-5">
          <h2 className="font-heading text-lg font-semibold text-foreground">Change Password</h2>
          <FormField label="New password" htmlFor="new-pass" helpText="Minimum 8 characters">
            <TextInput
              id="new-pass"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <FormField label="Confirm password" htmlFor="confirm-pass">
            <TextInput
              id="confirm-pass"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </FormField>
          <button
            type="button"
            disabled={!newPassword || !confirmPassword || newPassword.length < 8}
            onClick={handlePasswordChange}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-strong disabled:opacity-50 dark:text-slate-900"
          >
            Update password
          </button>
        </section>
      </div>
    </div>
  );
}
