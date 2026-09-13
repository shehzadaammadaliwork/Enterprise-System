import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CsrfService } from '../security/csrf.service';

/// Routes reachable before the client has ever received a CSRF token
/// (registration, login, the two password-reset steps, logout, refresh) or
/// invoked by non-browser API clients using only a Bearer token. State
/// change here is already guarded by rate limiting + the credential itself;
/// requiring a CSRF token first would be a chicken-and-egg problem.
const CSRF_EXEMPT_PATHS = [
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/refresh',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/verify-reset-code',
  '/api/v1/auth/reset-password',
];

/// Double-submit-cookie CSRF protection (Architecture Rule, Section 2) for
/// state-changing requests. Our access tokens travel as a Bearer header
/// (never auto-attached by the browser), so the only ambient credential at
/// risk is the httpOnly refresh-token cookie; this still protects any
/// browser-driven, cookie-aware mutation per the spec's blanket requirement.
/// Requests authenticated purely via `Authorization: Bearer` with no cookies
/// at all are exempt, since there is no ambient credential for a forged
/// cross-site request to ride on.
@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  constructor(private readonly csrfService: CsrfService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.csrfService.ensureAnonymousSession(req, res);

    // `req.path` is relative to wherever this middleware is mounted (Nest
    // mounts module-level middleware on the same sub-router as the global
    // prefix, so `req.path` here is prefix-stripped) — `req.originalUrl`
    // always has the full incoming path, which is what CSRF_EXEMPT_PATHS
    // is expressed in.
    const requestPath = req.originalUrl.split('?')[0];
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    const isExempt = CSRF_EXEMPT_PATHS.some((path) => requestPath === path);
    const hasBearerOnly =
      Boolean(req.headers.authorization) && !req.headers.cookie;

    if (!isMutating || isExempt || hasBearerOnly) {
      return next();
    }
    this.csrfService.handle(req, res, next);
  }
}
