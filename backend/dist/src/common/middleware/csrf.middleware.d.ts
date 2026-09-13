import { NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { CsrfService } from '../security/csrf.service';
export declare class CsrfMiddleware implements NestMiddleware {
    private readonly csrfService;
    constructor(csrfService: CsrfService);
    use(req: Request, res: Response, next: NextFunction): void;
}
