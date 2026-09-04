import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export interface StorageStatus {
  isInMemory: boolean;
  storage?: string;
  status?: string;
  error?: string;
  mongoUri?: string;
}

export function useStorageStatus(): StorageStatus {
  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-status'],
    queryFn: async () => {
      try {
        return await api.healthCheck();
      } catch {
        return null;
      }
    },
    staleTime: 60_000,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // If still loading, don't show banner yet
  if (isLoading) {
    return { isInMemory: false, status: 'loading' };
  }

  // If error or no data, show banner with error info
  if (error || !data) {
    return { isInMemory: true, status: 'error', error: String(error) };
  }

  const isInMemory = data.storage?.includes('in-memory') ?? false;

  return {
    isInMemory,
    storage: data.storage,
    status: data.status,
    error: data.error,
    mongoUri: data.mongoUri,
  };
}