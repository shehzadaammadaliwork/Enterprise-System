import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './assets.api';
import type { AssetFilters } from './assets.api';

const KEYS = {
  assets: ['assets', 'list'] as const,
  asset: (id: string) => ['assets', 'detail', id] as const,
};

export function useAssets(filters: AssetFilters = {}) {
  return useQuery({
    queryKey: [...KEYS.assets, filters],
    queryFn: () => api.fetchAssets(filters),
  });
}

export function useAsset(id: string | undefined) {
  return useQuery({ queryKey: KEYS.asset(id ?? ''), queryFn: () => api.fetchAsset(id!), enabled: !!id });
}

function useInvalidateAssets() {
  const queryClient = useQueryClient();
  // Invalidate the shared root, not just KEYS.assets — that's a sibling
  // of KEYS.asset(id), not its parent, so invalidating it alone leaves an
  // open detail page showing stale data after a status change.
  return () => queryClient.invalidateQueries({ queryKey: ['assets'] });
}

export function useCreateAsset() {
  const invalidate = useInvalidateAssets();
  return useMutation({ mutationFn: api.createAsset, onSuccess: invalidate });
}

export function useUpdateAsset() {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.AssetInput> }) => api.updateAsset(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteAsset() {
  const invalidate = useInvalidateAssets();
  return useMutation({ mutationFn: api.deleteAsset, onSuccess: invalidate });
}

export function useChangeAssetStatus() {
  const invalidate = useInvalidateAssets();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.ChangeAssetStatusInput }) => api.changeAssetStatus(id, input),
    onSuccess: invalidate,
  });
}
