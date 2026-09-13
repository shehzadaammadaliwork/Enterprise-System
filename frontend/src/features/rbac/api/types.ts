export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export type PermissionOverrideState = 'INHERITED' | 'GRANTED' | 'DENIED';
export type AccessLevel = 'ALLOWED' | 'DENIED';

export interface EmployeePermissionRow {
  permissionId: string;
  module: string;
  action: string;
  roleAccess: AccessLevel;
  override: PermissionOverrideState;
  effective: AccessLevel;
}

export interface EmployeeAccess {
  id: string;
  employeeId: string;
  userId: string;
  roles: Role[];
  permissions: EmployeePermissionRow[];
}
