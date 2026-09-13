import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import type { ModuleSlug, PermissionActionSlug } from '../constants/modules';

interface PermissionGuardProps {
  module: ModuleSlug;
  action: PermissionActionSlug;
  children: ReactNode;
}

/// Mirrors the backend's PermissionsGuard for the current user's cached
/// permission set (fetched from GET /rbac/me at login/refresh time). This
/// is a UX convenience only — the API enforces the real check server-side
/// regardless of what this guard lets render (Architecture Rule, Section 2).
export function PermissionGuard({ module, action, children }: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission(module, action));

  if (!hasPermission) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
}
