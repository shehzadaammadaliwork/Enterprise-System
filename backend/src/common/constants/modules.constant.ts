/// Canonical slug for every module in the system. RBAC permissions are keyed
/// as (module, action) pairs using these slugs — keep in sync with the 18
/// modules in the build spec as each one lands.
/// `payroll` is the one exception: not a numbered spec module, but a
/// sub-permission of Module 5 (Employee Management) split out during the
/// Module 7 hardening pass so compensation visibility (salary, payslips) can
/// be granted independently of general employee-directory access
/// (`employees:VIEW`) — see EmployeesService.toPublicShape/PayrollController.
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
