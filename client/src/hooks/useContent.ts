import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import type { AboutContent, SiteSettings } from '../../../shared/types';

export const keys = {
  about: ['about'] as const,
  settings: ['settings'] as const,
  resource: (name: string, params?: Record<string, unknown>) => ['resource', name, params ?? {}] as const,
  item: (name: string, id: string) => ['resource-item', name, id] as const,
  media: (params?: Record<string, unknown>) => ['media', params ?? {}] as const,
  cv: ['cv-versions'] as const,
  contact: (params?: Record<string, unknown>) => ['contact-messages', params ?? {}] as const,
  audit: ['audit-logs'] as const,
};

type BootData = { about?: AboutContent | null; settings?: SiteSettings | null };
const boot: BootData = (window as unknown as { __BOOT_DATA__?: BootData }).__BOOT_DATA__ ?? {};

// A failed/empty API response must NEVER wipe out content we already have
// (e.g. data embedded in the page by the server), so null becomes undefined
// which makes React Query keep the previously known data.
const getAboutOrKeep = async (): Promise<AboutContent | undefined> =>
  (await api.getAbout()) ?? undefined;

const getSettingsOrKeep = async (): Promise<SiteSettings | undefined> =>
  (await api.getSettings()) ?? undefined;

export const useAbout = () =>
  useQuery({
    queryKey: keys.about,
    queryFn: getAboutOrKeep,
    initialData: boot.about ?? undefined,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

export const useSettings = () =>
  useQuery({
    queryKey: keys.settings,
    queryFn: getSettingsOrKeep,
    initialData: boot.settings ?? undefined,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

export const useMedia = () =>
  useQuery({ queryKey: keys.media(), queryFn: () => api.getMedia(), staleTime: 120_000 });

/** Generic list hook bound to any REST resource on the API. */
export function useResource<T>(resource: string, params?: Record<string, string>) {
  return useQuery({
    queryKey: keys.resource(resource, params),
    queryFn: () => api.getList<T>(resource, params),
    staleTime: 0,
    refetchOnMount: 'always',
    // Pick up CMS edits made in another tab/window (e.g. the admin panel).
    refetchOnWindowFocus: true,
  });
}

/** Generic admin list hook returning every record including hidden ones. */
export function useAllRecords<T>(resource: string) {
  return useQuery({
    queryKey: [...keys.resource(resource), 'all'],
    queryFn: () => api.getAllIncludingHidden<T>(resource),
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSaveAbout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AboutContent>) => api.saveAbout(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.about }),
  });
}

export function useSaveSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<SiteSettings>) => api.saveSettings(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.settings }),
  });
}

interface MutationCallbacks {
  invalidateResource?: string;
}

export function useCreateRecord<T extends { _id?: string }>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<T>) => api.create<T>(resource, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['resource', resource] }),
  });
}

export function useUpdateRecord<T extends { _id?: string }>(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<T> }) =>
      api.update<T>(resource, id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['resource', resource] }),
  });
}

/** Lightweight partial update (PATCH). Does not re-validate the whole schema — safe for toggles. */
export function usePatchRecord(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      api.patch(resource, id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['resource', resource] }),
  });
}

export function useDeleteRecord(resource: string, options?: MutationCallbacks) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.remove(resource, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['resource', resource] });
      if (options?.invalidateResource) {
        void qc.invalidateQueries({ queryKey: ['resource', options.invalidateResource] });
      }
    },
  });
}

export function useReorderRecords(resource: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => api.reorder(resource, ids),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['resource', resource] }),
  });
}

export function useCvVersions() {
  return useQuery({
    queryKey: keys.cv,
    // NOTE: must wrap in an arrow — passing `api.getCvVersions` directly loses
    // the `this` binding and the request throws a non-ApiError TypeError,
    // surfacing as "Failed to load CV versions."
    queryFn: () => api.getCvVersions(),
    retry: 2,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
}

export function useContactMessages(params?: Record<string, string>) {
  return useQuery({ queryKey: keys.contact(params), queryFn: () => api.getContactMessages(params) });
}

export function useAuditLogs() {
  return useQuery({ queryKey: keys.audit, queryFn: () => api.getAuditLogs() });
}