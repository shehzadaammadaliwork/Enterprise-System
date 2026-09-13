import { ModuleSlug, PermissionActionSlug } from '../../common/constants/modules.constant';
export declare const REQUIRE_PERMISSION_KEY = "rbac:requiredPermission";
export interface RequiredPermission {
    module: ModuleSlug;
    action: PermissionActionSlug;
}
export declare const RequirePermission: (module: ModuleSlug, action: PermissionActionSlug) => import("@nestjs/common").CustomDecorator<string>;
