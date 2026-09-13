import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'auth:isPublic';

/// Marks a route as reachable without a valid access token — used by the
/// global JwtAuthGuard and PermissionsGuard alike so a single decorator
/// opts a route out of both checks (e.g. login, register, password reset).
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
