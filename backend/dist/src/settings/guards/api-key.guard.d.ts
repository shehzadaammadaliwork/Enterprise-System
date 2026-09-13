import { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKey } from '@prisma/client';
import { ApiKeysService } from '../services/api-keys.service';
export interface ApiKeyAuthenticatedRequest extends Request {
    apiKey?: ApiKey;
}
export declare class ApiKeyGuard implements CanActivate {
    private readonly apiKeysService;
    constructor(apiKeysService: ApiKeysService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
