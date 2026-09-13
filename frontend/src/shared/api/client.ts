import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/auth.store';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/// Fetched once and cached in-memory — the double-submit CSRF cookie this
/// backs doesn't rotate per request, so a single token is valid for the
/// lifetime of the browser session (see backend CsrfService).
let csrfTokenPromise: Promise<string> | null = null;

async function getCsrfToken(): Promise<string> {
  if (!csrfTokenPromise) {
    csrfTokenPromise = apiClient
      .get<{ success: true; data: { csrfToken: string } }>('/auth/csrf-token')
      .then((res) => res.data.data.csrfToken);
  }
  return csrfTokenPromise;
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const accessToken = useAuthStore.getState().accessToken;
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (config.method && MUTATING_METHODS.has(config.method)) {
    config.headers.set('x-csrf-token', await getCsrfToken());
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean;
}

let refreshPromise: Promise<string | null> | null = null;

/// Deduplicated so every caller — the 401 retry below, and the app-load
/// silent-refresh in useAuthBootstrap — shares one in-flight request. The
/// refresh token rotates on every use (see backend AuthService.refresh), so
/// two concurrent calls (e.g. React StrictMode's double effect invocation)
/// would otherwise race: the second arrives with an already-consumed
/// refresh cookie, which the backend treats as token-reuse and revokes the
/// whole session.
export async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post<{ success: true; data: { accessToken: string; user: import('../stores/auth.store').AuthUser } }>(
        '/auth/refresh',
      )
      .then((res) => {
        const { accessToken, user } = res.data.data;
        useAuthStore.getState().setAuth({ accessToken, user });
        return accessToken;
      })
      .catch(() => {
        useAuthStore.getState().clearAuth();
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

/// Endpoints a 401 should never trigger a refresh-and-retry for: the public
/// pre-auth ones (nothing to refresh yet), and `/auth/refresh` itself —
/// retrying *that* by calling `refreshAccessToken()` again would await the
/// very promise this rejection is part of, deadlocking forever.
const NO_REFRESH_RETRY_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/forgot-password',
  '/auth/reset-password',
];

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined;
    const isExemptRoute = NO_REFRESH_RETRY_PATHS.some((path) => config?.url === path);

    if (error.response?.status === 401 && config && !config._retried && !isExemptRoute) {
      config._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken) {
        config.headers.set('Authorization', `Bearer ${newToken}`);
        return apiClient(config);
      }
    }
    return Promise.reject(error);
  },
);

export interface ApiErrorBody {
  success: false;
  error: { code: string; message: string };
}

export function extractApiErrorMessage(error: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
  }
  return fallback;
}

export function extractApiErrorCode(error: unknown): string | null {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    return body?.error?.code ?? null;
  }
  return null;
}
