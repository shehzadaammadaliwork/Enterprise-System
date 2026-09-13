import { SetMetadata } from '@nestjs/common';
import {
  ModuleSlug,
  PermissionActionSlug,
} from '../../common/constants/modules.constant';

export const REQUIRE_PERMISSION_KEY = 'rbac:requiredPermission';

export interface RequiredPermission {
  module: ModuleSlug;
  action: PermissionActionSlug;
}

/// Declares the (module, action) permission a route requires. Enforced by
/// PermissionsGuard, which is installed globally (Architecture Rule,
/// Section 2: "Every route enforces RBAC permission checks at the API
/// layer"). Routes without this decorator only require authentication.
export const RequirePermission = (
  module: ModuleSlug,
  action: PermissionActionSlug,
) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, {
    module,
    action,
  } satisfies RequiredPermission);
