import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AppException } from '../common/filters/app-exception';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CsrfService } from '../common/security/csrf.service';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Verify2faDto } from './dto/verify-2fa.dto';
import type { IssuedTokens } from './auth.service';

const REFRESH_COOKIE_NAME = 'refresh_token';
/// Rate limit applied to endpoints that accept a password/credential guess,
/// tighter than the app-wide default (Architecture Rule, Section 2).
const AUTH_THROTTLE = { default: { limit: 5, ttl: 60_000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly csrfService: CsrfService,
  ) {}

  @Public()
  @Get('csrf-token')
  getCsrfToken(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return { csrfToken: this.csrfService.generateToken(req, res) };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      dto,
      this.requestContext(req),
    );
    this.setRefreshCookie(res, result);
    return this.stripRefreshToken(result);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto, this.requestContext(req));
    this.setRefreshCookie(res, result);
    return this.stripRefreshToken(result);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!rawToken) {
      throw new AppException(
        'INVALID_REFRESH_TOKEN',
        'No refresh token cookie present.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const result = await this.authService.refresh(
      rawToken,
      this.requestContext(req),
    );
    this.setRefreshCookie(res, result);
    return this.stripRefreshToken(result);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const rawToken = req.cookies?.[REFRESH_COOKIE_NAME];
    await this.authService.logout(rawToken);
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/' });
    return { loggedOut: true };
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('verify-reset-code')
  verifyResetCode(@Body() dto: VerifyResetCodeDto, @Req() req: Request) {
    return this.authService.verifyResetCode(
      dto.email,
      dto.code,
      this.requestContext(req),
    );
  }

  @Public()
  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() req: Request) {
    await this.authService.resetPassword(
      dto.resetSessionToken,
      dto.newPassword,
      this.requestContext(req),
    );
    return { reset: true };
  }

  @Get('sessions')
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.id);
  }

  @Delete('sessions/:id')
  revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.authService.revokeSession(user.id, id);
  }

  @Get('login-history')
  getLoginHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaginationQueryDto,
  ) {
    return this.authService.getLoginHistory(user.id, query);
  }

  @Post('2fa/setup')
  setup2fa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.setup2fa(user.id);
  }

  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/verify')
  async verify2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Verify2faDto,
  ) {
    await this.authService.verify2fa(user.id, dto.code);
    return { twoFactorEnabled: true };
  }

  @Throttle(AUTH_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @Post('2fa/disable')
  async disable2fa(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Verify2faDto,
  ) {
    await this.authService.disable2fa(user.id, dto.code);
    return { twoFactorEnabled: false };
  }

  private requestContext(req: Request) {
    return { ip: req.ip, userAgent: req.headers['user-agent'] };
  }

  /// Refresh token lives only in the httpOnly cookie — never in the JSON
  /// body, so it can't be read by page JS or logged by an API client.
  /// `persistent: false` ("Remember me" unchecked) omits `expires`, making
  /// it a session cookie the browser drops on close.
  private setRefreshCookie(res: Response, tokens: IssuedTokens) {
    res.cookie(REFRESH_COOKIE_NAME, tokens.refreshToken, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/api/v1/auth',
      ...(tokens.persistent ? { expires: tokens.refreshTokenExpiresAt } : {}),
    });
  }

  private stripRefreshToken<
    T extends {
      refreshToken?: string;
      refreshTokenExpiresAt?: Date;
      persistent?: boolean;
    },
  >(result: T) {
    const {
      refreshToken: _refreshToken,
      refreshTokenExpiresAt: _expiresAt,
      persistent: _persistent,
      ...rest
    } = result;
    return rest;
  }
}
