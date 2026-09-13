import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from '../rbac.service';
export declare class PermissionsGuard implements CanActivate {
    private readonly reflector;
    private readonly rbacService;
    constructor(reflector: Reflector, rbacService: RbacService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
