/// The fixed set of system roles from Section 3 of the build spec.
/// Seeded once by the RBAC seeder; cannot be deleted (Role.isSystem = true).
export const SYSTEM_ROLES = [
  'Admin',
  'CEO',
  'HR',
  'Sales Manager',
  'Sales Executive',
  'Team Lead',
  'Frontend Developer',
  'Backend Developer',
  'QA Engineer',
  'UI/UX Designer',
  'Accountant',
  'Support Agent',
] as const;

export type SystemRole = (typeof SYSTEM_ROLES)[number];
