"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsrfMiddleware = void 0;
const common_1 = require("@nestjs/common");
const csrf_service_1 = require("../security/csrf.service");
const CSRF_EXEMPT_PATHS = [
    '/api/v1/auth/register',
    '/api/v1/auth/login',
    '/api/v1/auth/refresh',
    '/api/v1/auth/logout',
    '/api/v1/auth/forgot-password',
    '/api/v1/auth/verify-reset-code',
    '/api/v1/auth/reset-password',
];
let CsrfMiddleware = class CsrfMiddleware {
    csrfService;
    constructor(csrfService) {
        this.csrfService = csrfService;
    }
    use(req, res, next) {
        this.csrfService.ensureAnonymousSession(req, res);
        const requestPath = req.originalUrl.split('?')[0];
        const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
        const isExempt = CSRF_EXEMPT_PATHS.some((path) => requestPath === path);
        const hasBearerOnly = Boolean(req.headers.authorization) && !req.headers.cookie;
        if (!isMutating || isExempt || hasBearerOnly) {
            return next();
        }
        this.csrfService.handle(req, res, next);
    }
};
exports.CsrfMiddleware = CsrfMiddleware;
exports.CsrfMiddleware = CsrfMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [csrf_service_1.CsrfService])
], CsrfMiddleware);
//# sourceMappingURL=csrf.middleware.js.map