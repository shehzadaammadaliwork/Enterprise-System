import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import {
  REQUIRE_PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';
import { RbacService } from '../rbac.service';

/// Installed globally (APP_GUARD) so every endpoint enforces RBAC at the API
/// layer, not just in the UI (Architecture Rule, Section 2). Routes without
/// an explicit @RequirePermission(...) still require authentication (that
/// part is handled by JwtAuthGuard) but no specific permission.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndOverride<RequiredPermission>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as { id: string } | undefined;
    if (!user) return false;

    const allowed = await this.rbacService.userHasPermission(
      user.id,
      required.module,
      required.action,
    );
    if (!allowed) {
      throw new ForbiddenException({
        code: 'PERMISSION_DENIED',
        message: `Missing permission ${required.module}:${required.action}.`,
      });
    }
    return true;
  }
}
