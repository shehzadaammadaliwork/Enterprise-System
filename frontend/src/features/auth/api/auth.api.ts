import { apiClient } from '../../../shared/api/client';
import type { AuthUser, Role } from '../../../shared/stores/auth.store';

interface Envelope<T> {
  success: true;
  data: T;
}

interface AuthResponse {
  user: AuthUser;
  accessToken: string;
}

export interface MyAccess {
  roles: Role[];
  permissions: string[];
  hasEmployeeProfile: boolean;
}

export async function login(input: { email: string; password: string; totpCode?: string; rememberMe?: boolean }) {
  const res = await apiClient.post<Envelope<AuthResponse>>('/auth/login', input);
  return res.data.data;
}

export async function register(input: { email: string; password: string; firstName: string; lastName: string }) {
  const res = await apiClient.post<Envelope<AuthResponse>>('/auth/register', input);
  return res.data.data;
}

export async function refresh() {
  const res = await apiClient.post<Envelope<AuthResponse>>('/auth/refresh');
  return res.data.data;
}

export async function logout() {
  await apiClient.post('/auth/logout');
}

export async function forgotPassword(email: string) {
  const res = await apiClient.post<Envelope<{ devOtpCode?: string }>>('/auth/forgot-password', { email });
  return res.data.data;
}

export async function verifyResetCode(input: { email: string; code: string }) {
  const res = await apiClient.post<Envelope<{ resetSessionToken: string }>>('/auth/verify-reset-code', input);
  return res.data.data;
}

export async function resetPassword(input: { resetSessionToken: string; newPassword: string }) {
  await apiClient.post('/auth/reset-password', input);
}

export async function fetchMyAccess() {
  const res = await apiClient.get<Envelope<MyAccess>>('/rbac/me');
  return res.data.data;
}
