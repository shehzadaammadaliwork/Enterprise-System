import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './documents.api';

const KEYS = {
  documents: (entityType: string, entityId: string) =>
    ['documents', entityType, entityId] as const,
  document: (id: string) => ['documents', 'detail', id] as const,
  roles: ['documents', 'roles'] as const,
};

export function useDocuments(entityType: string, entityId: string) {
  return useQuery({
    queryKey: KEYS.documents(entityType, entityId),
    queryFn: () => api.fetchDocuments(entityType, entityId),
  });
}

export function useDocument(id: string | undefined) {
  return useQuery({
    queryKey: KEYS.document(id ?? ''),
    queryFn: () => api.fetchDocument(id!),
    enabled: !!id,
  });
}

/// Roles are only used to populate the "restrict to specific roles" picker
/// — fails silently (empty list) for a user without rbac:VIEW, since that
/// sub-feature is inherently admin-level; the rest of Documents works fine
/// without it.
export function useRolesForAccessPicker() {
  return useQuery({
    queryKey: KEYS.roles,
    queryFn: api.fetchRoles,
    retry: false,
    throwOnError: false,
  });
}

function useInvalidateDocuments(entityType: string, entityId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['documents', entityType, entityId] });
}

export function useUploadDocument(entityType: string, entityId: string) {
  const invalidate = useInvalidateDocuments(entityType, entityId);
  return useMutation({ mutationFn: api.uploadDocument, onSuccess: invalidate });
}

export function useAddDocumentVersion(entityType: string, entityId: string) {
  const invalidate = useInvalidateDocuments(entityType, entityId);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => api.addDocumentVersion(id, file),
    onSuccess: (_data, variables) => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: KEYS.document(variables.id) });
    },
  });
}

export function useUpdateDocument(entityType: string, entityId: string) {
  const invalidate = useInvalidateDocuments(entityType, entityId);
  return useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.updateDocument(id, title),
    onSuccess: invalidate,
  });
}

export function useSetDocumentAccess(entityType: string, entityId: string) {
  const invalidate = useInvalidateDocuments(entityType, entityId);
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: api.SetDocumentAccessInput }) =>
      api.setDocumentAccess(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteDocument(entityType: string, entityId: string) {
  const invalidate = useInvalidateDocuments(entityType, entityId);
  return useMutation({ mutationFn: api.deleteDocument, onSuccess: invalidate });
}
