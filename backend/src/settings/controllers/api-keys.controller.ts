import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeysService } from '../services/api-keys.service';
import { ApiKeyGuard } from '../guards/api-key.guard';
import type { ApiKeyAuthenticatedRequest } from '../guards/api-key.guard';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

@Controller('settings/api-keys')
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Get()
  @RequirePermission('settings', 'VIEW')
  listKeys() {
    return this.apiKeysService.listKeys();
  }

  @Post()
  @RequirePermission('settings', 'CREATE')
  @AuditEntity('ApiKey')
  createKey(
    @Body() dto: CreateApiKeyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.apiKeysService.createKey(dto, user.id);
  }

  @Delete(':id')
  @RequirePermission('settings', 'DELETE')
  @AuditEntity('ApiKey')
  revokeKey(@Param('id') id: string) {
    return this.apiKeysService.revokeKey(id);
  }

  /// Proof-of-mechanism demo route: authenticated via X-Api-Key instead of
  /// the usual JWT session, via ApiKeyGuard applied directly here — @Public()
  /// skips the global JwtAuthGuard/PermissionsGuard pair (which otherwise
  /// run before any route-level guard and would 401 a request with no
  /// Bearer token before ApiKeyGuard ever runs).
  @Get('ping')
  @Public()
  @UseGuards(ApiKeyGuard)
  ping(@Req() request: ApiKeyAuthenticatedRequest) {
    return { ok: true, keyLabel: request.apiKey?.label };
  }
}
