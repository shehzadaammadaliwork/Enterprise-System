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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const throttler_1 = require("@nestjs/throttler");
const auth_service_1 = require("./auth.service");
const app_exception_1 = require("../common/filters/app-exception");
const public_decorator_1 = require("../common/decorators/public.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const csrf_service_1 = require("../common/security/csrf.service");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const forgot_password_dto_1 = require("./dto/forgot-password.dto");
const verify_reset_code_dto_1 = require("./dto/verify-reset-code.dto");
const reset_password_dto_1 = require("./dto/reset-password.dto");
const verify_2fa_dto_1 = require("./dto/verify-2fa.dto");
const REFRESH_COOKIE_NAME = 'refresh_token';
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };
let AuthController = class AuthController {
    authService;
    csrfService;
    constructor(authService, csrfService) {
        this.authService = authService;
        this.csrfService = csrfService;
    }
    getCsrfToken(req, res) {
        return { csrfToken: this.csrfService.generateToken(req, res) };
    }
    async register(dto, req, res) {
        const result = await this.authService.register(dto, this.requestContext(req));
        this.setRefreshCookie(res, result);
        return this.stripRefreshToken(result);
    }
    async login(dto, req, res) {
        const result = await this.authService.login(dto, this.requestContext(req));
        this.setRefreshCookie(res, result);
        return this.stripRefreshToken(result);
    }
    async refresh(req, res) {
        const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
        if (!rawToken) {
            throw new app_exception_1.AppException('INVALID_REFRESH_TOKEN', 'No refresh token cookie present.', common_1.HttpStatus.UNAUTHORIZED);
        }
        const result = await this.authService.refresh(rawToken, this.requestContext(req));
        this.setRefreshCookie(res, result);
        return this.stripRefreshToken(result);
    }
    async logout(req, res) {
        const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
        await this.authService.logout(rawToken);
        res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
        return { loggedOut: true };
    }
    forgotPassword(dto) {
        return this.authService.forgotPassword(dto.email);
    }
    verifyResetCode(dto, req) {
        return this.authService.verifyResetCode(dto.email, dto.code, this.requestContext(req));
    }
    async resetPassword(dto, req) {
        await this.authService.resetPassword(dto.resetSessionToken, dto.newPassword, this.requestContext(req));
        return { reset: true };
    }
    listSessions(user) {
        return this.authService.listSessions(user.id);
    }
    revokeSession(user, id) {
        return this.authService.revokeSession(user.id, id);
    }
    getLoginHistory(user, query) {
        return this.authService.getLoginHistory(user.id, query);
    }
    setup2fa(user) {
        return this.authService.setup2fa(user.id);
    }
    async verify2fa(user, dto) {
        await this.authService.verify2fa(user.id, dto.code);
        return { twoFactorEnabled: true };
    }
    async disable2fa(user, dto) {
        await this.authService.disable2fa(user.id, dto.code);
        return { twoFactorEnabled: false };
    }
    requestContext(req) {
        return { ip: req.ip, userAgent: req.headers['user-agent'] };
    }
    setRefreshCookie(res, tokens) {
        res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === 'production',
            path: '/api/v1/auth',
            ...(tokens.persistent ? { expires: tokens.refreshTokenExpiresAt } : {}),
        });
    }
    stripRefreshToken(result) {
        const { refreshToken: _refreshToken, refreshTokenExpiresAt: _expiresAt, persistent: _persistent, ...rest } = result;
        return rest;
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('csrf-token'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCsrfToken", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('forgot-password'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [forgot_password_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('verify-reset-code'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [verify_reset_code_dto_1.VerifyResetCodeDto, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "verifyResetCode", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('reset-password'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [reset_password_dto_1.ResetPasswordDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Get)('sessions'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "listSessions", null);
__decorate([
    (0, common_1.Delete)('sessions/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Get)('login-history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getLoginHistory", null);
__decorate([
    (0, common_1.Post)('2fa/setup'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setup2fa", null);
__decorate([
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('2fa/verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_2fa_dto_1.Verify2faDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verify2fa", null);
__decorate([
    (0, throttler_1.Throttle)(AUTH_THROTTLE),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, common_1.Post)('2fa/disable'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, verify_2fa_dto_1.Verify2faDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "disable2fa", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        csrf_service_1.CsrfService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map