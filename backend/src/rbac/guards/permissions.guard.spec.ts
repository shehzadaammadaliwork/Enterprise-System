import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { RbacService } from '../rbac.service';

/// Covers the "backend actually blocks unauthorized operations, not just
/// the sidebar" requirement: a route with no @RequirePermission only needs
/// authentication (this is what keeps Dashboard/My Work/self-service "me"
/// routes reachable by a zero-role employee), a route that declares one is
/// rejected outright when the caller's effective permissions don't include
/// it — regardless of what the frontend would have shown or hidden.
describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let rbacService: { userHasPermission: jest.Mock };

  function contextWith(user: { id: string } | undefined): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
  }

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    rbacService = { userHasPermission: jest.fn() };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      rbacService as unknown as RbacService,
    );
  });

  it('allows a route with no @RequirePermission for any authenticated user, without consulting RbacService', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(undefined) // isPublic
      .mockReturnValueOnce(undefined); // required permission

    const allowed = await guard.canActivate(contextWith({ id: 'user-1' }));

    expect(allowed).toBe(true);
    expect(rbacService.userHasPermission).not.toHaveBeenCalled();
  });

  it('rejects a route requiring a permission the caller does not have — even via a direct call, not just hidden from the menu', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ module: 'finance', action: 'VIEW' });
    rbacService.userHasPermission.mockResolvedValue(false);

    await expect(
      guard.canActivate(contextWith({ id: 'user-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a route requiring a permission the caller has via their effective (role + override) access', async () => {
    reflector.getAllAndOverride
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ module: 'finance', action: 'VIEW' });
    rbacService.userHasPermission.mockResolvedValue(true);

    const allowed = await guard.canActivate(contextWith({ id: 'user-1' }));

    expect(allowed).toBe(true);
  });
});
