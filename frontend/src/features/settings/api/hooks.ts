import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './settings.api';

const KEYS = {
  settings: ['settings'] as const,
  apiKeys: ['settings', 'api-keys'] as const,
  backups: ['settings', 'backups'] as const,
  restore: (id: string) => ['settings', 'restores', id] as const,
};

// -- General settings ---------------------------------------------------

export function useSettings() {
  return useQuery({ queryKey: KEYS.settings, queryFn: api.fetchSettings });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.settings }),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.uploadLogo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.settings }),
  });
}

export function useDeleteLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLogo,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.settings }),
  });
}

// -- API keys -------------------------------------------------------------

export function useApiKeys() {
  return useQuery({ queryKey: KEYS.apiKeys, queryFn: api.fetchApiKeys });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.apiKeys }),
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.revokeApiKey,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.apiKeys }),
  });
}

// -- Backups & restore ------------------------------------------------------

export function useBackups(page = 1) {
  return useQuery({ queryKey: [...KEYS.backups, page], queryFn: () => api.fetchBackups(page) });
}

export function useRunBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.runBackup,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.backups }),
  });
}

export function useRestoreBackup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirmationPhrase }: { id: string; confirmationPhrase: string }) =>
      api.restoreBackup(id, confirmationPhrase),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.backups }),
  });
}

/// Polled while the restore is in flight — maintenance mode means every
/// other route 503s during this window, so this is deliberately the one
/// query the UI keeps alive.
export function useRestoreStatus(id: string | null) {
  return useQuery({
    queryKey: KEYS.restore(id ?? 'none'),
    queryFn: () => api.fetchRestore(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'PENDING' || status === 'RUNNING' ? 2000 : false;
    },
  });
}
