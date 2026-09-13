"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const qrcode = __importStar(require("qrcode"));
const otplib_1 = require("otplib");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../common/prisma/prisma.service");
const password_service_1 = require("../common/security/password.service");
const encryption_service_1 = require("../common/security/encryption.service");
const app_exception_1 = require("../common/filters/app-exception");
const pagination_dto_1 = require("../common/pagination/pagination.dto");
const password_reset_otp_template_1 = require("./templates/password-reset-otp.template");
let AuthService = AuthService_1 = class AuthService {
    prisma;
    jwtService;
    configService;
    passwordService;
    encryptionService;
    logger = new common_1.Logger(AuthService_1.name);
    constructor(prisma, jwtService, configService, passwordService, encryptionService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.configService = configService;
        this.passwordService = passwordService;
        this.encryptionService = encryptionService;
    }
    async register(dto, ctx) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new app_exception_1.AppException('EMAIL_ALREADY_REGISTERED', 'An account with this email already exists.', common_1.HttpStatus.CONFLICT);
        }
        const passwordHash = await this.passwordService.hash(dto.password);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                firstName: dto.firstName,
                lastName: dto.lastName,
            },
        });
        const tokens = await this.issueTokens(user.id, ctx);
        return { user: this.toSafeUser(user), ...tokens };
    }
    async login(dto, ctx) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            await this.recordLoginHistory(null, dto.email, ctx, client_1.LoginOutcome.FAILED_NOT_FOUND);
            throw this.invalidCredentials();
        }
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.FAILED_LOCKED);
            throw new app_exception_1.AppException('ACCOUNT_LOCKED', `Account is locked until ${user.lockedUntil.toISOString()} due to too many failed attempts.`, common_1.HttpStatus.FORBIDDEN);
        }
        if (!user.isActive) {
            await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.FAILED_INACTIVE);
            throw new app_exception_1.AppException('ACCOUNT_INACTIVE', 'This account has been deactivated.', common_1.HttpStatus.FORBIDDEN);
        }
        const passwordValid = await this.passwordService.compare(dto.password, user.passwordHash);
        if (!passwordValid) {
            await this.registerFailedAttempt(user.id);
            await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.FAILED_PASSWORD);
            throw this.invalidCredentials();
        }
        if (user.twoFactorEnabled) {
            if (!dto.totpCode) {
                await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.FAILED_2FA);
                throw new app_exception_1.AppException('TWO_FACTOR_REQUIRED', 'A 2FA code is required to complete login.', common_1.HttpStatus.UNAUTHORIZED);
            }
            const secret = this.encryptionService.decrypt(user.twoFactorSecret);
            const valid = otplib_1.authenticator.verify({ token: dto.totpCode, secret });
            if (!valid) {
                await this.registerFailedAttempt(user.id);
                await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.FAILED_2FA);
                throw new app_exception_1.AppException('INVALID_2FA_CODE', 'The provided 2FA code is invalid.', common_1.HttpStatus.UNAUTHORIZED);
            }
        }
        await this.prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null },
        });
        await this.recordLoginHistory(user.id, dto.email, ctx, client_1.LoginOutcome.SUCCESS);
        const tokens = await this.issueTokens(user.id, ctx, undefined, dto.rememberMe ?? true);
        return { user: this.toSafeUser(user), ...tokens };
    }
    async refresh(rawRefreshToken, ctx) {
        let payload;
        try {
            payload = this.jwtService.verify(rawRefreshToken, {
                secret: this.configService.get('jwt', { infer: true }).refreshSecret,
            });
        }
        catch {
            throw new app_exception_1.AppException('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.', common_1.HttpStatus.UNAUTHORIZED);
        }
        const tokenHash = this.hashToken(rawRefreshToken);
        const session = await this.prisma.session.findUnique({
            where: { id: payload.sid },
        });
        if (!session || session.refreshTokenHash !== tokenHash) {
            throw new app_exception_1.AppException('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.', common_1.HttpStatus.UNAUTHORIZED);
        }
        if (session.revokedAt || session.expiresAt < new Date()) {
            await this.revokeAllSessions(session.userId);
            throw new app_exception_1.AppException('SESSION_REUSE_DETECTED', 'This session is no longer valid. Please log in again.', common_1.HttpStatus.UNAUTHORIZED);
        }
        await this.prisma.session.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
        });
        const user = await this.prisma.user.findUnique({
            where: { id: session.userId },
        });
        if (!user || !user.isActive) {
            throw new app_exception_1.AppException('INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired.', common_1.HttpStatus.UNAUTHORIZED);
        }
        const tokens = await this.issueTokens(user.id, ctx, session.id, session.persistent);
        return { user: this.toSafeUser(user), ...tokens };
    }
    async logout(rawRefreshToken) {
        if (!rawRefreshToken)
            return;
        const tokenHash = this.hashToken(rawRefreshToken);
        await this.prisma.session.updateMany({
            where: { refreshTokenHash: tokenHash, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async listActiveUserIds() {
        const users = await this.prisma.user.findMany({
            where: { isActive: true },
            select: { id: true },
        });
        return users.map((u) => u.id);
    }
    async listSessions(userId) {
        return this.prisma.session.findMany({
            where: { userId, revokedAt: null },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                ip: true,
                userAgent: true,
                createdAt: true,
                expiresAt: true,
            },
        });
    }
    async revokeSession(userId, sessionId) {
        const session = await this.prisma.session.findUnique({
            where: { id: sessionId },
        });
        if (!session || session.userId !== userId) {
            throw new app_exception_1.AppException('SESSION_NOT_FOUND', 'Session not found.', common_1.HttpStatus.NOT_FOUND);
        }
        await this.prisma.session.update({
            where: { id: sessionId },
            data: { revokedAt: new Date() },
        });
    }
    async getLoginHistory(userId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.loginHistory.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                skip,
                take,
            }),
            this.prisma.loginHistory.count({ where: { userId } }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async forgotPassword(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            return {};
        const code = (0, crypto_1.randomInt)(0, 1_000_000).toString().padStart(6, '0');
        const codeHash = this.hashToken(code);
        const { otpTtlMinutes } = this.configService.get('passwordReset', {
            infer: true,
        });
        await this.prisma.$transaction([
            this.prisma.passwordResetOtp.updateMany({
                where: { userId: user.id, consumedAt: null },
                data: { consumedAt: new Date() },
            }),
            this.prisma.passwordResetSession.updateMany({
                where: { userId: user.id, consumedAt: null },
                data: { consumedAt: new Date() },
            }),
            this.prisma.passwordResetOtp.create({
                data: {
                    userId: user.id,
                    codeHash,
                    expiresAt: new Date(Date.now() + otpTtlMinutes * 60_000),
                },
            }),
        ]);
        const { subject, text } = (0, password_reset_otp_template_1.buildPasswordResetOtpEmail)(code, otpTtlMinutes);
        this.logger.log(`Password reset OTP email to ${email} — subject: "${subject}"\n${text}`);
        return this.configService.get('nodeEnv', { infer: true }) !== 'production'
            ? { devOtpCode: code }
            : {};
    }
    async verifyResetCode(email, code, ctx) {
        const invalidCode = () => new app_exception_1.AppException('INVALID_RESET_CODE', 'That code is invalid or has expired.', common_1.HttpStatus.BAD_REQUEST);
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user) {
            await this.recordLoginHistory(null, email, ctx, client_1.LoginOutcome.FAILED_RESET_OTP);
            throw invalidCode();
        }
        const otp = await this.prisma.passwordResetOtp.findFirst({
            where: { userId: user.id, consumedAt: null },
            orderBy: { createdAt: 'desc' },
        });
        if (!otp || otp.expiresAt < new Date()) {
            await this.recordLoginHistory(user.id, email, ctx, client_1.LoginOutcome.FAILED_RESET_OTP);
            throw invalidCode();
        }
        const { otpMaxAttempts } = this.configService.get('passwordReset', {
            infer: true,
        });
        if (this.hashToken(code) !== otp.codeHash) {
            const attempts = otp.attempts + 1;
            const lockedOut = attempts >= otpMaxAttempts;
            await this.prisma.passwordResetOtp.update({
                where: { id: otp.id },
                data: { attempts, ...(lockedOut ? { consumedAt: new Date() } : {}) },
            });
            await this.recordLoginHistory(user.id, email, ctx, client_1.LoginOutcome.FAILED_RESET_OTP);
            throw lockedOut
                ? new app_exception_1.AppException('RESET_CODE_LOCKED', 'Too many incorrect attempts. Please request a new code.', common_1.HttpStatus.TOO_MANY_REQUESTS)
                : invalidCode();
        }
        const rawSessionToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const { sessionTtlMinutes } = this.configService.get('passwordReset', {
            infer: true,
        });
        await this.prisma.$transaction([
            this.prisma.passwordResetOtp.update({
                where: { id: otp.id },
                data: { consumedAt: new Date() },
            }),
            this.prisma.passwordResetSession.create({
                data: {
                    userId: user.id,
                    tokenHash: this.hashToken(rawSessionToken),
                    expiresAt: new Date(Date.now() + sessionTtlMinutes * 60_000),
                },
            }),
        ]);
        return { resetSessionToken: rawSessionToken };
    }
    async resetPassword(rawResetSessionToken, newPassword, ctx) {
        const tokenHash = this.hashToken(rawResetSessionToken);
        const resetSession = await this.prisma.passwordResetSession.findUnique({
            where: { tokenHash },
        });
        if (!resetSession ||
            resetSession.consumedAt ||
            resetSession.expiresAt < new Date()) {
            throw new app_exception_1.AppException('INVALID_RESET_SESSION', 'This reset session is invalid or has expired. Please request a new code.', common_1.HttpStatus.BAD_REQUEST);
        }
        const passwordHash = await this.passwordService.hash(newPassword);
        const [user] = await this.prisma.$transaction([
            this.prisma.user.update({
                where: { id: resetSession.userId },
                data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
            }),
            this.prisma.passwordResetSession.update({
                where: { id: resetSession.id },
                data: { consumedAt: new Date() },
            }),
        ]);
        await this.revokeAllSessions(resetSession.userId);
        await this.recordLoginHistory(user.id, user.email, ctx, client_1.LoginOutcome.PASSWORD_RESET_SUCCESS);
    }
    async setup2fa(userId) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const secret = otplib_1.authenticator.generateSecret();
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorSecret: this.encryptionService.encrypt(secret) },
        });
        const otpAuthUrl = otplib_1.authenticator.keyuri(user.email, 'Enterprise System', secret);
        const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
        return { otpAuthUrl, qrCodeDataUrl };
    }
    async verify2fa(userId, code) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        if (!user.twoFactorSecret) {
            throw new app_exception_1.AppException('TWO_FACTOR_NOT_SETUP', 'Call /auth/2fa/setup first.', common_1.HttpStatus.BAD_REQUEST);
        }
        const secret = this.encryptionService.decrypt(user.twoFactorSecret);
        if (!otplib_1.authenticator.verify({ token: code, secret })) {
            throw new app_exception_1.AppException('INVALID_2FA_CODE', 'The provided 2FA code is invalid.', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: true },
        });
    }
    async disable2fa(userId, code) {
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        if (!user.twoFactorEnabled || !user.twoFactorSecret)
            return;
        const secret = this.encryptionService.decrypt(user.twoFactorSecret);
        if (!otplib_1.authenticator.verify({ token: code, secret })) {
            throw new app_exception_1.AppException('INVALID_2FA_CODE', 'The provided 2FA code is invalid.', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.prisma.user.update({
            where: { id: userId },
            data: { twoFactorEnabled: false, twoFactorSecret: null },
        });
    }
    async issueTokens(userId, ctx, previousSessionId, persistent = true) {
        const jwtConfig = this.configService.get('jwt', { infer: true });
        const expiresAt = new Date(Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn));
        const session = await this.prisma.session.create({
            data: {
                userId,
                refreshTokenHash: 'pending',
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                expiresAt,
                persistent,
            },
        });
        const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: userId },
        });
        const accessPayload = {
            sub: userId,
            email: user.email,
        };
        const refreshPayload = {
            sub: userId,
            sid: session.id,
        };
        const accessToken = this.jwtService.sign(accessPayload, {
            secret: jwtConfig.accessSecret,
            expiresIn: jwtConfig.accessExpiresIn,
        });
        const refreshToken = this.jwtService.sign(refreshPayload, {
            secret: jwtConfig.refreshSecret,
            expiresIn: jwtConfig.refreshExpiresIn,
        });
        await this.prisma.session.update({
            where: { id: session.id },
            data: { refreshTokenHash: this.hashToken(refreshToken) },
        });
        if (previousSessionId) {
            await this.prisma.session.update({
                where: { id: previousSessionId },
                data: { replacedByHash: this.hashToken(refreshToken) },
            });
        }
        return {
            accessToken,
            refreshToken,
            refreshTokenExpiresAt: expiresAt,
            persistent,
        };
    }
    async revokeAllSessions(userId) {
        await this.prisma.session.updateMany({
            where: { userId, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async registerFailedAttempt(userId) {
        const { maxFailedAttempts, lockoutMinutes } = this.configService.get('loginSecurity', { infer: true });
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { failedLoginAttempts: { increment: 1 } },
        });
        if (user.failedLoginAttempts >= maxFailedAttempts) {
            await this.prisma.user.update({
                where: { id: userId },
                data: {
                    lockedUntil: new Date(Date.now() + lockoutMinutes * 60_000),
                    failedLoginAttempts: 0,
                },
            });
        }
    }
    async recordLoginHistory(userId, email, ctx, outcome) {
        await this.prisma.loginHistory.create({
            data: {
                userId: userId ?? undefined,
                email,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                outcome,
            },
        });
    }
    hashToken(raw) {
        return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
    }
    invalidCredentials() {
        return new app_exception_1.AppException('INVALID_CREDENTIALS', 'Invalid email or password.', common_1.HttpStatus.UNAUTHORIZED);
    }
    toSafeUser(user) {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            twoFactorEnabled: user.twoFactorEnabled,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        password_service_1.PasswordService,
        encryption_service_1.FieldEncryptionService])
], AuthService);
const DURATION_UNIT_MS = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
};
function parseDurationToMs(value) {
    const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
    if (!match) {
        throw new Error(`Invalid duration string "${value}" — expected e.g. "15m", "7d".`);
    }
    return Number(match[1]) * DURATION_UNIT_MS[match[2]];
}
//# sourceMappingURL=auth.service.js.map