import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes, randomInt } from 'crypto';
import * as qrcode from 'qrcode';
import { authenticator } from 'otplib';
import { LoginOutcome } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppConfig } from '../common/config/configuration';
import { PasswordService } from '../common/security/password.service';
import { FieldEncryptionService } from '../common/security/encryption.service';
import { AppException } from '../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../common/pagination/pagination.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
} from './types/jwt-payload.interface';
import { buildPasswordResetOtpEmail } from './templates/password-reset-otp.template';

export interface RequestContext {
  ip?: string;
  userAgent?: string;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  /// Whether the caller should persist the refresh-token cookie across
  /// browser restarts ("Remember me") or set it as a session cookie.
  persistent: boolean;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly passwordService: PasswordService,
    private readonly encryptionService: FieldEncryptionService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new AppException(
        'EMAIL_ALREADY_REGISTERED',
        'An account with this email already exists.',
        HttpStatus.CONFLICT,
      );
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    // Self-registration grants no RBAC roles — an Admin/HR sets the account
    // up as an Employee with a real role afterwards. Until then the user
    // has zero permissions and lands on the Dashboard's pending-setup state.
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

  async login(dto: LoginDto, ctx: RequestContext) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      await this.recordLoginHistory(
        null,
        dto.email,
        ctx,
        LoginOutcome.FAILED_NOT_FOUND,
      );
      throw this.invalidCredentials();
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.recordLoginHistory(
        user.id,
        dto.email,
        ctx,
        LoginOutcome.FAILED_LOCKED,
      );
      throw new AppException(
        'ACCOUNT_LOCKED',
        `Account is locked until ${user.lockedUntil.toISOString()} due to too many failed attempts.`,
        HttpStatus.FORBIDDEN,
      );
    }

    if (!user.isActive) {
      await this.recordLoginHistory(
        user.id,
        dto.email,
        ctx,
        LoginOutcome.FAILED_INACTIVE,
      );
      throw new AppException(
        'ACCOUNT_INACTIVE',
        'This account has been deactivated.',
        HttpStatus.FORBIDDEN,
      );
    }

    const passwordValid = await this.passwordService.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordValid) {
      await this.registerFailedAttempt(user.id);
      await this.recordLoginHistory(
        user.id,
        dto.email,
        ctx,
        LoginOutcome.FAILED_PASSWORD,
      );
      throw this.invalidCredentials();
    }

    if (user.twoFactorEnabled) {
      if (!dto.totpCode) {
        await this.recordLoginHistory(
          user.id,
          dto.email,
          ctx,
          LoginOutcome.FAILED_2FA,
        );
        throw new AppException(
          'TWO_FACTOR_REQUIRED',
          'A 2FA code is required to complete login.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      const secret = this.encryptionService.decrypt(user.twoFactorSecret!);
      const valid = authenticator.verify({ token: dto.totpCode, secret });
      if (!valid) {
        await this.registerFailedAttempt(user.id);
        await this.recordLoginHistory(
          user.id,
          dto.email,
          ctx,
          LoginOutcome.FAILED_2FA,
        );
        throw new AppException(
          'INVALID_2FA_CODE',
          'The provided 2FA code is invalid.',
          HttpStatus.UNAUTHORIZED,
        );
      }
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await this.recordLoginHistory(
      user.id,
      dto.email,
      ctx,
      LoginOutcome.SUCCESS,
    );

    const tokens = await this.issueTokens(
      user.id,
      ctx,
      undefined,
      dto.rememberMe ?? true,
    );
    return { user: this.toSafeUser(user), ...tokens };
  }

  async refresh(rawRefreshToken: string, ctx: RequestContext) {
    let payload: RefreshTokenPayload;
    try {
      payload = this.jwtService.verify<RefreshTokenPayload>(rawRefreshToken, {
        secret: this.configService.get('jwt', { infer: true }).refreshSecret,
      });
    } catch {
      throw new AppException(
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
    });

    if (!session || session.refreshTokenHash !== tokenHash) {
      throw new AppException(
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.revokedAt || session.expiresAt < new Date()) {
      /// The token was already rotated/revoked and is being replayed — a
      /// strong signal of theft. Kill every session for this user.
      await this.revokeAllSessions(session.userId);
      throw new AppException(
        'SESSION_REUSE_DETECTED',
        'This session is no longer valid. Please log in again.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: session.userId },
    });
    if (!user || !user.isActive) {
      throw new AppException(
        'INVALID_REFRESH_TOKEN',
        'Refresh token is invalid or expired.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const tokens = await this.issueTokens(
      user.id,
      ctx,
      session.id,
      session.persistent,
    );
    return { user: this.toSafeUser(user), ...tokens };
  }

  async logout(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) return;
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  /// Exported for NotificationsService.broadcast() — a company-wide
  /// announcement needs every active user's id, and Notifications has no
  /// direct access to the `users` table per the cross-module query rule.
  async listActiveUserIds(): Promise<string[]> {
    const users = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  async listSessions(userId: string) {
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

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.userId !== userId) {
      throw new AppException(
        'SESSION_NOT_FOUND',
        'Session not found.',
        HttpStatus.NOT_FOUND,
      );
    }
    await this.prisma.session.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });
  }

  async getLoginHistory(userId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.loginHistory.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.loginHistory.count({ where: { userId } }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  // ---------------------------------------------------------------------
  // Forgot / reset password
  // ---------------------------------------------------------------------

  async forgotPassword(email: string): Promise<{ devOtpCode?: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Always behave the same whether or not the account exists, so this
    // endpoint can't be used to enumerate registered emails.
    if (!user) return {};

    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = this.hashToken(code);
    const { otpTtlMinutes } = this.configService.get('passwordReset', {
      infer: true,
    });

    await this.prisma.$transaction([
      // A fresh code supersedes any code/session still outstanding from an
      // earlier request — only the most recent code should ever be usable.
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

    const { subject, text } = buildPasswordResetOtpEmail(code, otpTtlMinutes);
    /// No transactional email provider is wired up yet (that lands with
    /// Module 14/19's shared notification dispatcher) — log the rendered
    /// template so the flow is testable end-to-end in the meantime.
    this.logger.log(
      `Password reset OTP email to ${email} — subject: "${subject}"\n${text}`,
    );
    return this.configService.get('nodeEnv', { infer: true }) !== 'production'
      ? { devOtpCode: code }
      : {};
  }

  async verifyResetCode(
    email: string,
    code: string,
    ctx: RequestContext,
  ): Promise<{ resetSessionToken: string }> {
    const invalidCode = () =>
      new AppException(
        'INVALID_RESET_CODE',
        'That code is invalid or has expired.',
        HttpStatus.BAD_REQUEST,
      );

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      await this.recordLoginHistory(
        null,
        email,
        ctx,
        LoginOutcome.FAILED_RESET_OTP,
      );
      throw invalidCode();
    }

    const otp = await this.prisma.passwordResetOtp.findFirst({
      where: { userId: user.id, consumedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.expiresAt < new Date()) {
      await this.recordLoginHistory(
        user.id,
        email,
        ctx,
        LoginOutcome.FAILED_RESET_OTP,
      );
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
      await this.recordLoginHistory(
        user.id,
        email,
        ctx,
        LoginOutcome.FAILED_RESET_OTP,
      );
      throw lockedOut
        ? new AppException(
            'RESET_CODE_LOCKED',
            'Too many incorrect attempts. Please request a new code.',
            HttpStatus.TOO_MANY_REQUESTS,
          )
        : invalidCode();
    }

    const rawSessionToken = randomBytes(32).toString('hex');
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

  async resetPassword(
    rawResetSessionToken: string,
    newPassword: string,
    ctx: RequestContext,
  ): Promise<void> {
    const tokenHash = this.hashToken(rawResetSessionToken);
    const resetSession = await this.prisma.passwordResetSession.findUnique({
      where: { tokenHash },
    });

    if (
      !resetSession ||
      resetSession.consumedAt ||
      resetSession.expiresAt < new Date()
    ) {
      throw new AppException(
        'INVALID_RESET_SESSION',
        'This reset session is invalid or has expired. Please request a new code.',
        HttpStatus.BAD_REQUEST,
      );
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
    await this.recordLoginHistory(
      user.id,
      user.email,
      ctx,
      LoginOutcome.PASSWORD_RESET_SUCCESS,
    );
  }

  // ---------------------------------------------------------------------
  // Two-factor authentication (TOTP)
  // ---------------------------------------------------------------------

  async setup2fa(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    const secret = authenticator.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: this.encryptionService.encrypt(secret) },
    });

    const otpAuthUrl = authenticator.keyuri(
      user.email,
      'Enterprise System',
      secret,
    );
    const qrCodeDataUrl = await qrcode.toDataURL(otpAuthUrl);
    return { otpAuthUrl, qrCodeDataUrl };
  }

  async verify2fa(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.twoFactorSecret) {
      throw new AppException(
        'TWO_FACTOR_NOT_SETUP',
        'Call /auth/2fa/setup first.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const secret = this.encryptionService.decrypt(user.twoFactorSecret);
    if (!authenticator.verify({ token: code, secret })) {
      throw new AppException(
        'INVALID_2FA_CODE',
        'The provided 2FA code is invalid.',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });
  }

  async disable2fa(userId: string, code: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
    });
    if (!user.twoFactorEnabled || !user.twoFactorSecret) return;
    const secret = this.encryptionService.decrypt(user.twoFactorSecret);
    if (!authenticator.verify({ token: code, secret })) {
      throw new AppException(
        'INVALID_2FA_CODE',
        'The provided 2FA code is invalid.',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: false, twoFactorSecret: null },
    });
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private async issueTokens(
    userId: string,
    ctx: RequestContext,
    previousSessionId?: string,
    persistent = true,
  ): Promise<IssuedTokens> {
    const jwtConfig = this.configService.get('jwt', { infer: true });
    const expiresAt = new Date(
      Date.now() + parseDurationToMs(jwtConfig.refreshExpiresIn),
    );

    // Session row is created first with a placeholder hash so we have an id
    // to embed in the refresh JWT payload (`sid`), then patched with the
    // real hash once the token is signed.
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
    const accessPayload: AccessTokenPayload = {
      sub: userId,
      email: user.email,
    };
    const refreshPayload: RefreshTokenPayload = {
      sub: userId,
      sid: session.id,
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: jwtConfig.accessSecret,
      // `@nestjs/jwt` narrows `expiresIn` to a `ms`-style template literal
      // type, but ours comes from a free-form env var (e.g. "15m") — widen
      // the type here; the underlying `jsonwebtoken` lib parses it at runtime.
      expiresIn: jwtConfig.accessExpiresIn as unknown as number,
    });
    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: jwtConfig.refreshSecret,
      expiresIn: jwtConfig.refreshExpiresIn as unknown as number,
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

  private async revokeAllSessions(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async registerFailedAttempt(userId: string): Promise<void> {
    const { maxFailedAttempts, lockoutMinutes } = this.configService.get(
      'loginSecurity',
      { infer: true },
    );
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

  private async recordLoginHistory(
    userId: string | null,
    email: string,
    ctx: RequestContext,
    outcome: LoginOutcome,
  ) {
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

  private hashToken(raw: string): string {
    return createHash('sha256').update(raw).digest('hex');
  }

  private invalidCredentials() {
    return new AppException(
      'INVALID_CREDENTIALS',
      'Invalid email or password.',
      HttpStatus.UNAUTHORIZED,
    );
  }

  private toSafeUser(user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    twoFactorEnabled: boolean;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      twoFactorEnabled: user.twoFactorEnabled,
    };
  }
}

const DURATION_UNIT_MS: Record<string, number> = {
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/// Parses simple `<number><unit>` durations (e.g. "15m", "7d") as used by
/// JWT_*_EXPIRES_IN env vars. Avoids pulling in the `ms` package solely for
/// this one conversion (`@nestjs/jwt`/`jsonwebtoken` parse the same strings
/// internally when signing).
function parseDurationToMs(value: string): number {
  const match = /^(\d+)\s*(s|m|h|d)$/.exec(value.trim());
  if (!match) {
    throw new Error(
      `Invalid duration string "${value}" — expected e.g. "15m", "7d".`,
    );
  }
  return Number(match[1]) * DURATION_UNIT_MS[match[2]];
}
