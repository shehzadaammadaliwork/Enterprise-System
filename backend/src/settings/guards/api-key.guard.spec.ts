import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { ApiKeysService } from '../services/api-keys.service';

function contextWithHeader(header: string | undefined): ExecutionContext {
  const request: {
    headers: Record<string, string | undefined>;
    apiKey?: unknown;
  } = {
    headers: header !== undefined ? { 'x-api-key': header } : {},
  };
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let apiKeysService: { validateKey: jest.Mock };

  beforeEach(() => {
    apiKeysService = { validateKey: jest.fn() };
    guard = new ApiKeyGuard(apiKeysService as unknown as ApiKeysService);
  });

  it('rejects a request with no X-Api-Key header', async () => {
    await expect(
      guard.canActivate(contextWithHeader(undefined)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(apiKeysService.validateKey).not.toHaveBeenCalled();
  });

  it('rejects a key that fails validation (missing, revoked, or expired)', async () => {
    apiKeysService.validateKey.mockResolvedValue(null);
    await expect(
      guard.canActivate(contextWithHeader('bad-key')),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('accepts a valid key and attaches it to the request', async () => {
    const key = { id: 'key-1', label: 'CI key' };
    apiKeysService.validateKey.mockResolvedValue(key);
    const context = contextWithHeader('good-key');
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(context.switchToHttp().getRequest().apiKey).toBe(key);
  });
});
