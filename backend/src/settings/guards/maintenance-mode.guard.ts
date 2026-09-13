import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Request } from 'express';
import { MaintenanceModeService } from '../services/maintenance-mode.service';

/// Global guard (registered in app.module.ts, right after ThrottlerGuard,
/// ahead of JwtAuthGuard) — while a restore's pg_restore is actually
/// running, every request 503s except the settings/backups endpoints
/// themselves, so the frontend can keep polling restore status. Matches
/// req.originalUrl (not req.path — same gotcha CsrfMiddleware documents:
/// req.path is prefix-stripped relative to wherever middleware/guards see
/// the request from) against a hardcoded prefix, same convention
/// CsrfMiddleware's own CSRF_EXEMPT_PATHS already uses.
const ALLOWED_DURING_MAINTENANCE_PREFIX = '/api/v1/settings/backups';

@Injectable()
export class MaintenanceModeGuard implements CanActivate {
  constructor(
    private readonly maintenanceModeService: MaintenanceModeService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (!this.maintenanceModeService.isActive()) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const path = (request.originalUrl ?? request.url ?? '').split('?')[0];
    if (path.startsWith(ALLOWED_DURING_MAINTENANCE_PREFIX)) return true;

    throw new ServiceUnavailableException({
      code: 'MAINTENANCE_MODE',
      message: 'A database restore is in progress. Please try again shortly.',
    });
  }
}
