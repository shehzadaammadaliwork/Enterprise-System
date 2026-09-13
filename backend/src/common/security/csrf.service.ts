import { Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { doubleCsrf } from 'csrf-csrf';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';

const ANONYMOUS_SESSION_COOKIE = 'csrf_sid';

interface RequestWithCsrfCache extends Request {
  _csrfSid?: string;
}

/// Wraps the `csrf-csrf` double-submit-cookie setup as a single shared
/// service so both the CSRF middleware (validation) and the auth
/// controller's token-issuing endpoint (generation) share one configuration
/// and one notion of "session identifier" per request.
@Injectable()
export class CsrfService {
  readonly protect;
  private readonly generate;

  constructor(private readonly configService: ConfigService<AppConfig, true>) {
    const { doubleCsrfProtection, generateCsrfToken } = doubleCsrf({
      getSecret: () => this.configService.get('csrf', { infer: true }).secret,
      getSessionIdentifier: (req) =>
        this.getOrCreateAnonymousSessionId(req as RequestWithCsrfCache),
      cookieName: 'csrf_token',
      cookieOptions: {
        httpOnly: false,
        sameSite: 'strict',
        secure:
          this.configService.get('nodeEnv', { infer: true }) === 'production',
        path: '/',
      },
      getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
    });
    this.protect = doubleCsrfProtection;
    this.generate = generateCsrfToken;
  }

  generateToken(req: Request, res: Response): string {
    this.getOrCreateAnonymousSessionId(req as RequestWithCsrfCache, res);
    return this.generate(req, res);
  }

  ensureAnonymousSession(req: Request, res: Response): void {
    this.getOrCreateAnonymousSessionId(req as RequestWithCsrfCache, res);
  }

  handle(req: Request, res: Response, next: NextFunction): void {
    this.protect(req, res, next);
  }

  /// Cached per-request (not just per-cookie) so a single request never mints
  /// two different identifiers if this is consulted more than once — e.g. once
  /// while priming the cookie in middleware and again inside `csrf-csrf`'s own
  /// token generation/validation.
  private getOrCreateAnonymousSessionId(
    req: RequestWithCsrfCache,
    res?: Response,
  ): string {
    if (req._csrfSid) return req._csrfSid;

    const existing = req.cookies?.[ANONYMOUS_SESSION_COOKIE] as
      string | undefined;
    const id = existing ?? randomUUID();
    req._csrfSid = id;

    if (!existing && res) {
      res.cookie(ANONYMOUS_SESSION_COOKIE, id, {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
      });
    }
    return id;
  }
}
