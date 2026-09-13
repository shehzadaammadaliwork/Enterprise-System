import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SettingsService } from '../services/settings.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from '../dto/update-settings.dto';

const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024;

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermission('settings', 'VIEW')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  @RequirePermission('settings', 'EDIT')
  @AuditEntity('SystemSettings')
  updateSettings(
    @Body() dto: UpdateSettingsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.settingsService.updateSettings(dto, user.id);
  }

  @Post('branding/logo')
  @RequirePermission('settings', 'EDIT')
  @AuditEntity('SystemSettings')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_LOGO_SIZE_BYTES } }),
  )
  uploadLogo(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!file) throw new BadRequestException('A logo file is required.');
    return this.settingsService.uploadLogo(file, user.id);
  }

  @Delete('branding/logo')
  @RequirePermission('settings', 'EDIT')
  @AuditEntity('SystemSettings')
  deleteLogo(@CurrentUser() user: AuthenticatedUser) {
    return this.settingsService.deleteLogo(user.id);
  }
}
