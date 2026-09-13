import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { RunBackupDto } from '../dto/run-backup.dto';
import { RestoreBackupDto } from '../dto/restore-backup.dto';

@Controller('settings/backups')
export class BackupsController {
  constructor(private readonly backupService: BackupService) {}

  @Get()
  @RequirePermission('settings', 'VIEW')
  listBackups(@Query() query: PaginationQueryDto) {
    return this.backupService.listBackups(query);
  }

  @Post('run')
  @RequirePermission('settings', 'EDIT')
  @AuditEntity('BackupRecord')
  runBackup(@Body() dto: RunBackupDto, @CurrentUser() user: AuthenticatedUser) {
    return this.backupService.enqueueBackup(
      dto.type ?? 'FULL',
      'MANUAL',
      user.id,
    );
  }

  @Get(':id/download')
  @RequirePermission('settings', 'EDIT')
  downloadBackup(@Param('id') id: string) {
    return this.backupService.downloadBackup(id);
  }

  /// The one destructive route in this module — permission alone isn't
  /// enough, RestoreBackupDto also carries a typed confirmation the service
  /// validates against this same :id and a fixed phrase before anything
  /// runs (see BackupService.requestRestore / RESTORE_CONFIRMATION_PHRASE).
  @Post(':id/restore')
  @RequirePermission('settings', 'DELETE')
  @AuditEntity('RestoreRecord')
  restoreBackup(
    @Param('id') id: string,
    @Body() dto: RestoreBackupDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.backupService.requestRestore(id, dto, user.id);
  }

  @Get('restores/:id')
  @RequirePermission('settings', 'VIEW')
  getRestore(@Param('id') id: string) {
    return this.backupService.getRestoreOrThrow(id);
  }
}
