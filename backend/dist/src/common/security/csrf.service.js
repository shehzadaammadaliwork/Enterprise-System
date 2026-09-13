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
exports.CsrfService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const csrf_csrf_1 = require("csrf-csrf");
const config_1 = require("@nestjs/config");
const ANONYMOUS_SESSION_COOKIE = 'csrf_sid';
let CsrfService = class CsrfService {
    configService;
    protect;
    generate;
    constructor(configService) {
        this.configService = configService;
        const { doubleCsrfProtection, generateCsrfToken } = (0, csrf_csrf_1.doubleCsrf)({
            getSecret: () => this.configService.get('csrf', { infer: true }).secret,
            getSessionIdentifier: (req) => this.getOrCreateAnonymousSessionId(req),
            cookieName: 'csrf_token',
            cookieOptions: {
                httpOnly: false,
                sameSite: 'strict',
                secure: this.configService.get('nodeEnv', { infer: true }) === 'production',
                path: '/',
            },
            getCsrfTokenFromRequest: (req) => req.headers['x-csrf-token'],
        });
        this.protect = doubleCsrfProtection;
        this.generate = generateCsrfToken;
    }
    generateToken(req, res) {
        this.getOrCreateAnonymousSessionId(req, res);
        return this.generate(req, res);
    }
    ensureAnonymousSession(req, res) {
        this.getOrCreateAnonymousSessionId(req, res);
    }
    handle(req, res, next) {
        this.protect(req, res, next);
    }
    getOrCreateAnonymousSessionId(req, res) {
        if (req._csrfSid)
            return req._csrfSid;
        const existing = req.cookies?.[ANONYMOUS_SESSION_COOKIE];
        const id = existing ?? (0, crypto_1.randomUUID)();
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
};
exports.CsrfService = CsrfService;
exports.CsrfService = CsrfService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CsrfService);
//# sourceMappingURL=csrf.service.js.map