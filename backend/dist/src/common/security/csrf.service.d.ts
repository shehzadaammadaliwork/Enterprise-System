import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
export declare class CsrfService {
    private readonly configService;
    readonly protect: any;
    private readonly generate;
    constructor(configService: ConfigService<AppConfig, true>);
    generateToken(req: Request, res: Response): string;
    ensureAnonymousSession(req: Request, res: Response): void;
    handle(req: Request, res: Response, next: NextFunction): void;
    private getOrCreateAnonymousSessionId;
}
