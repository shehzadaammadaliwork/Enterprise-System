export type DocumentAccessScope = 'EVERYONE' | 'SPECIFIC_ROLES' | 'SPECIFIC_USERS';

export interface DocumentVersion {
  id: string;
  documentId: string;
  versionNumber: number;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  checksum: string;
  uploadedByUserId: string;
  createdAt: string;
}

export interface DocumentAccessGrant {
  id: string;
  documentId: string;
  roleId: string | null;
  userId: string | null;
  createdAt: string;
}

export interface DocumentSummary {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  accessScope: DocumentAccessScope;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
  accessGrants: DocumentAccessGrant[];
  latestVersion: DocumentVersion | null;
}

export interface DocumentDetail {
  id: string;
  entityType: string;
  entityId: string;
  title: string;
  accessScope: DocumentAccessScope;
  uploadedByUserId: string;
  createdAt: string;
  updatedAt: string;
  accessGrants: DocumentAccessGrant[];
  versions: DocumentVersion[];
}
