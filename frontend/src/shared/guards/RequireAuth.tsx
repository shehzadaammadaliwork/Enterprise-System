import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

/// Gates every route under it behind an authenticated session. Rendered
/// only after the app-level silent-refresh attempt (see App.tsx) has
/// settled, so a page reload doesn't bounce a still-valid session to
/// /login before the refresh-token cookie has had a chance to prove itself.
export function RequireAuth() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const isInitializing = useAuthStore((state) => state.isInitializing);
  const location = useLocation();

  if (isInitializing) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}
