import { create } from 'zustand';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  roles: Role[];
  /// "<module>:<action>" keys, e.g. "employees:CREATE" — mirrors the
  /// backend's RbacService.getUserPermissionKeys shape exactly so route
  /// guards can do a plain string lookup.
  permissions: string[];
  /// Whether this account has a linked Employee record — drives the
  /// Dashboard/"My Work" account-state rules (see DashboardPage), not just
  /// employee-scoped route guards.
  hasEmployeeProfile: boolean;
  /// False until the initial silent-refresh-on-load attempt has settled,
  /// so route guards don't redirect to /login before we've even checked
  /// whether the refresh-token cookie still holds a valid session.
  isInitializing: boolean;
  setAuth: (data: { accessToken: string; user: AuthUser }) => void;
  setAccess: (data: { roles: Role[]; permissions: string[]; hasEmployeeProfile: boolean }) => void;
  clearAuth: () => void;
  setInitializing: (value: boolean) => void;
  hasPermission: (module: string, action: string) => boolean;
  hasRole: (roleName: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  roles: [],
  permissions: [],
  hasEmployeeProfile: false,
  isInitializing: true,

  setAuth: ({ accessToken, user }) => set({ accessToken, user }),
  setAccess: ({ roles, permissions, hasEmployeeProfile }) => set({ roles, permissions, hasEmployeeProfile }),
  clearAuth: () =>
    set({ accessToken: null, user: null, roles: [], permissions: [], hasEmployeeProfile: false }),
  setInitializing: (value) => set({ isInitializing: value }),

  hasPermission: (module, action) => get().permissions.includes(`${module}:${action}`),
  hasRole: (roleName) => get().roles.some((role) => role.name === roleName),
}));
