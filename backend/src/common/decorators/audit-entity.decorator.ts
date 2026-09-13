import { SetMetadata } from '@nestjs/common';

export const AUDIT_ENTITY_KEY = 'audit:entityType';

/// Optional per-route override for the entity type recorded in the audit
/// log (e.g. `@AuditEntity('Employee')`). Without it, the global interceptor
/// falls back to a best-effort guess from the controller's class name.
export const AuditEntity = (entityType: string) =>
  SetMetadata(AUDIT_ENTITY_KEY, entityType);
