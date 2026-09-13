export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE';

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: AuditAction;
  module: string;
  entityType: string;
  entityId: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  method: string | null;
  path: string | null;
  createdAt: string;
}
