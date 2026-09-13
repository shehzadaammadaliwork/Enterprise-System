import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { DocumentAccessScope, DocumentDetail, DocumentSummary, DocumentVersion } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export async function fetchDocuments(entityType: string, entityId: string, page = 1, limit = 50) {
  const res = await apiClient.get<PaginatedEnvelope<DocumentSummary>>('/documents', {
    params: { entityType, entityId, page, limit },
  });
  return res.data;
}

export async function fetchDocument(id: string) {
  const res = await apiClient.get<Envelope<DocumentDetail>>(`/documents/${id}`);
  return res.data.data;
}

export interface UploadDocumentInput {
  entityType: string;
  entityId: string;
  title: string;
  file: File;
}

export async function uploadDocument(input: UploadDocumentInput) {
  const formData = new FormData();
  formData.append('entityType', input.entityType);
  formData.append('entityId', input.entityId);
  formData.append('title', input.title);
  formData.append('file', input.file);
  const res = await apiClient.post<Envelope<DocumentDetail>>('/documents', formData);
  return res.data.data;
}

export async function addDocumentVersion(id: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<Envelope<DocumentVersion>>(`/documents/${id}/versions`, formData);
  return res.data.data;
}

export async function updateDocument(id: string, title: string) {
  const res = await apiClient.patch<Envelope<DocumentDetail>>(`/documents/${id}`, { title });
  return res.data.data;
}

export interface SetDocumentAccessInput {
  scope: DocumentAccessScope;
  roleIds?: string[];
  userIds?: string[];
}

export async function setDocumentAccess(id: string, input: SetDocumentAccessInput) {
  const res = await apiClient.patch<Envelope<DocumentDetail>>(`/documents/${id}/access`, input);
  return res.data.data;
}

export async function deleteDocument(id: string) {
  await apiClient.delete(`/documents/${id}`);
}

/// Downloads go through apiClient (not a plain <a href>) since the route is
/// Authorization-header-protected — fetches as a blob, then triggers a
/// browser save via a throwaway object URL.
export async function downloadDocumentVersion(
  documentId: string,
  versionId: string | undefined,
  fileName: string,
) {
  const url = versionId
    ? `/documents/${documentId}/versions/${versionId}/download`
    : `/documents/${documentId}/download`;
  const res = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const blobUrl = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(blobUrl);
}

export async function fetchRoles() {
  const res = await apiClient.get<PaginatedEnvelope<{ id: string; name: string }>>('/rbac/roles', {
    params: { limit: 100 },
  });
  return res.data;
}
