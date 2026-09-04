import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export function useStorageStatus() {
  const { data } = useQuery({
    queryKey: ['storage-status'],
    queryFn: async () => {
      try {
        return await api.healthCheck();
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchOnMount: 'always',
  });

  const isInMemory = data?.storage?.includes('in-memory') ?? true;

  return { isInMemory, storage: data?.storage, status: data?.status };
}