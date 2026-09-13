import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiKey } from '@prisma/client';
import { ApiKeysService } from '../services/api-keys.service';

export interface ApiKeyAuthenticatedRequest extends Request {
  apiKey?: ApiKey;
}

/// Opt-in per-route guard (`@UseGuards(ApiKeyGuard)`), not part of the
/// global JwtAuthGuard/PermissionsGuard chain — JWT stays the only session
/// auth mechanism. Applied here to one demo route
/// (`GET /settings/api-keys/ping`) proving generation -> use -> revocation
/// actually works end-to-end; Module 19 is where a broader external API
/// surface reuses this same guard on its own routes.
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<ApiKeyAuthenticatedRequest>();
    const header = request.headers['x-api-key'];
    const plaintextKey = Array.isArray(header) ? header[0] : header;
    if (!plaintextKey) {
      throw new UnauthorizedException({
        code: 'API_KEY_MISSING',
        message: 'X-Api-Key header is required.',
      });
    }

    const key = await this.apiKeysService.validateKey(plaintextKey);
    if (!key) {
      throw new UnauthorizedException({
        code: 'API_KEY_INVALID',
        message: 'Invalid, revoked, or expired API key.',
      });
    }
    request.apiKey = key;
    return true;
  }
}
