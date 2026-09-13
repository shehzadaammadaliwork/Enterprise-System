import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

interface RoleGuardProps {
  roles: string[];
  children: ReactNode;
}

/// Coarser-grained alternative to PermissionGuard for routes that should
/// only be reachable by specific roles (e.g. one of the 13 system roles
/// from the spec) regardless of their individual permission grants.
export function RoleGuard({ roles, children }: RoleGuardProps) {
  const hasAnyRole = useAuthStore((state) => roles.some((roleName) => state.hasRole(roleName)));

  if (!hasAnyRole) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
