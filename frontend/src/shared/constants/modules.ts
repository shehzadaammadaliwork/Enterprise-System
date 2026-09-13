/// Mirrors backend/src/common/constants/modules.constant.ts — keep in sync
/// as each of the 18 modules lands. `payroll` is a sub-permission of Module
/// 5, not a numbered spec module — see the backend constant's comment.
export const MODULES = [
  'auth',
  'rbac',
  'dashboard',
  'organization',
  'employees',
  'payroll',
  'audit-logs',
  'crm',
  'sales',
  'finance',
  'inventory',
  'procurement',
  'documents',
  'notifications',
  'calendar',
  'reports',
  'settings',
  'integrations',
] as const;

export type ModuleSlug = (typeof MODULES)[number];

export const PERMISSION_ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE'] as const;
export type PermissionActionSlug = (typeof PERMISSION_ACTIONS)[number];
