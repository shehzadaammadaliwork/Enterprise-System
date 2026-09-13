import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppConfig } from '../common/config/configuration';
import { PasswordService } from '../common/security/password.service';
import { FieldEncryptionService } from '../common/security/encryption.service';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export interface RequestContext {
    ip?: string;
    userAgent?: string;
}
export interface IssuedTokens {
    accessToken: string;
    refreshToken: string;
    refreshTokenExpiresAt: Date;
    persistent: boolean;
}
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    private readonly configService;
    private readonly passwordService;
    private readonly encryptionService;
    private readonly logger;
    constructor(prisma: PrismaService, jwtService: JwtService, configService: ConfigService<AppConfig, true>, passwordService: PasswordService, encryptionService: FieldEncryptionService);
    register(dto: RegisterDto, ctx: RequestContext): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        persistent: boolean;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            twoFactorEnabled: boolean;
        };
    }>;
    login(dto: LoginDto, ctx: RequestContext): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        persistent: boolean;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            twoFactorEnabled: boolean;
        };
    }>;
    refresh(rawRefreshToken: string, ctx: RequestContext): Promise<{
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: Date;
        persistent: boolean;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            twoFactorEnabled: boolean;
        };
    }>;
    logout(rawRefreshToken: string | undefined): Promise<void>;
    listActiveUserIds(): Promise<string[]>;
    listSessions(userId: string): Promise<{
        id: string;
        createdAt: Date;
        ip: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(userId: string, sessionId: string): Promise<void>;
    getLoginHistory(userId: string, query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            email: string;
            ip: string | null;
            userId: string | null;
            userAgent: string | null;
            outcome: import("@prisma/client").$Enums.LoginOutcome;
        }[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    forgotPassword(email: string): Promise<{
        devOtpCode?: string;
    }>;
    verifyResetCode(email: string, code: string, ctx: RequestContext): Promise<{
        resetSessionToken: string;
    }>;
    resetPassword(rawResetSessionToken: string, newPassword: string, ctx: RequestContext): Promise<void>;
    setup2fa(userId: string): Promise<{
        otpAuthUrl: string;
        qrCodeDataUrl: string;
    }>;
    verify2fa(userId: string, code: string): Promise<void>;
    disable2fa(userId: string, code: string): Promise<void>;
    private issueTokens;
    private revokeAllSessions;
    private registerFailedAttempt;
    private recordLoginHistory;
    private hashToken;
    private invalidCredentials;
    private toSafeUser;
}
