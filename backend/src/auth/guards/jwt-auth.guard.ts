import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

/// Installed globally (APP_GUARD) so every route requires a valid access
/// token by default; @Public() opts a route out (Architecture Rule,
/// Section 2). Runs before PermissionsGuard so `request.user` is populated
/// by the time permission checks run.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(err: unknown, user: TUser): TUser {
    if (err || !user) {
      throw err instanceof Error
        ? err
        : new UnauthorizedException({
            code: 'UNAUTHENTICATED',
            message: 'Invalid or missing access token.',
          });
    }
    return user;
  }
}
