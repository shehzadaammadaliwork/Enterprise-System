import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth.store';
import { refreshAccessToken } from '../api/client';
import { fetchMyAccess } from '../../features/auth/api/auth.api';
import { connectSocket, disconnectSocket } from '../websocket/socket';

/// Runs once on app load. The access token only ever lives in memory (not
/// localStorage, to limit XSS blast radius), so a page reload has none —
/// this silently exchanges the httpOnly refresh-token cookie for a fresh
/// one before route guards decide whether to bounce to /login.
///
/// Goes through the same deduplicated `refreshAccessToken` the 401-retry
/// interceptor uses (not auth.api's raw `refresh()` call) — React
/// StrictMode invokes effects twice in development, and two independent
/// `/auth/refresh` calls would race against the backend's one-time-use
/// refresh token rotation.
export function useAuthBootstrap() {
  const setAccess = useAuthStore((state) => state.setAccess);
  const setInitializing = useAuthStore((state) => state.setInitializing);
  const accessToken = useAuthStore((state) => state.accessToken);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const token = await refreshAccessToken();
      if (cancelled || !token) {
        if (!cancelled) setInitializing(false);
        return;
      }
      try {
        const access = await fetchMyAccess();
        if (!cancelled) setAccess(access);
      } finally {
        if (!cancelled) setInitializing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (accessToken) {
      connectSocket();
      return () => disconnectSocket();
    }
  }, [accessToken]);
}
