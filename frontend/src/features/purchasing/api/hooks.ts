import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './purchasing.api';
import type { PurchaseRequestFilters } from './purchasing.api';

const KEYS = {
  requests: ['purchase-requests', 'list'] as const,
  myRequests: ['purchase-requests', 'me'] as const,
  request: (id: string) => ['purchase-requests', 'detail', id] as const,
};

export function usePurchaseRequests(filters: PurchaseRequestFilters = {}) {
  return useQuery({
    queryKey: [...KEYS.requests, filters],
    queryFn: () => api.fetchPurchaseRequests(filters),
  });
}

export function useMyPurchaseRequests() {
  return useQuery({ queryKey: KEYS.myRequests, queryFn: () => api.fetchMyPurchaseRequests() });
}

export function usePurchaseRequest(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.request(id ?? ''),
    queryFn: () => api.fetchPurchaseRequest(id!),
    enabled: !!id,
  });
}

function useInvalidatePurchaseRequests() {
  const queryClient = useQueryClient();
  // Invalidate the shared root, not just KEYS.requests/myRequests — those
  // are siblings of KEYS.request(id), not its parent, so invalidating them
  // alone leaves an open detail page showing stale data after a mutation.
  return () => queryClient.invalidateQueries({ queryKey: ['purchase-requests'] });
}

export function useCreatePurchaseRequest() {
  const invalidate = useInvalidatePurchaseRequests();
  return useMutation({ mutationFn: api.createPurchaseRequest, onSuccess: invalidate });
}

export function useDecidePurchaseRequest() {
  const invalidate = useInvalidatePurchaseRequests();
  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) => api.decidePurchaseRequest(id, approve),
    onSuccess: invalidate,
  });
}

export function useMarkPurchased() {
  const invalidate = useInvalidatePurchaseRequests();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.MarkPurchasedInput }) => api.markPurchased(id, input),
    onSuccess: () => {
      invalidate();
      // Mark as Purchased may create a new Finance Transaction and/or Asset.
      queryClient.invalidateQueries({ queryKey: ['finance'] });
      queryClient.invalidateQueries({ queryKey: ['assets'] });
    },
  });
}
