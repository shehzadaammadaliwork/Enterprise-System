import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CsrfService } from '../common/security/csrf.service';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
export declare class AuthController {
    private readonly authService;
    private readonly csrfService;
    constructor(authService: AuthService, csrfService: CsrfService);
    getCsrfToken(req: Request, res: Response): {
        csrfToken: string;
    };
    register(dto: RegisterDto, req: Request, res: Response): Promise<Omit<{
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
    }, "persistent" | "refreshToken" | "refreshTokenExpiresAt">>;
    login(dto: LoginDto, req: Request, res: Response): Promise<Omit<{
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
    }, "persistent" | "refreshToken" | "refreshTokenExpiresAt">>;
    refresh(req: Request, res: Response): Promise<Omit<{
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
    }, "persistent" | "refreshToken" | "refreshTokenExpiresAt">>;
    logout(req: Request, res: Response): Promise<{
        loggedOut: boolean;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        devOtpCode?: string;
    }>;
    verifyResetCode(dto: VerifyResetCodeDto, req: Request): Promise<{
        resetSessionToken: string;
    }>;
    resetPassword(dto: ResetPasswordDto, req: Request): Promise<{
        reset: boolean;
    }>;
    listSessions(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        ip: string | null;
        userAgent: string | null;
        expiresAt: Date;
    }[]>;
    revokeSession(user: AuthenticatedUser, id: string): Promise<void>;
    getLoginHistory(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
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
    setup2fa(user: AuthenticatedUser): Promise<{
        otpAuthUrl: string;
        qrCodeDataUrl: string;
    }>;
    verify2fa(user: AuthenticatedUser, dto: Verify2faDto): Promise<{
        twoFactorEnabled: boolean;
    }>;
    disable2fa(user: AuthenticatedUser, dto: Verify2faDto): Promise<{
        twoFactorEnabled: boolean;
    }>;
    private requestContext;
    private setRefreshCookie;
    private stripRefreshToken;
}
