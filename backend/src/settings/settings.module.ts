import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { SettingsController } from './controllers/settings.controller';
import { ApiKeysController } from './controllers/api-keys.controller';
import { BackupsController } from './controllers/backups.controller';
import { SettingsService } from './services/settings.service';
import { ApiKeysService } from './services/api-keys.service';
import { BackupService, BACKUPS_QUEUE } from './services/backup.service';
import { BackupSchedulerService } from './services/backup-scheduler.service';
import { MaintenanceModeService } from './services/maintenance-mode.service';
import { BackupProcessor } from './processors/backup.processor';
import { ApiKeyGuard } from './guards/api-key.guard';

/// ScheduleModule.forRoot() is registered here, not app.module.ts — no
/// other module needs SchedulerRegistry, and Module 18 is the first (only)
/// consumer of it, for the admin-editable scheduled-backup cron
/// (BackupSchedulerService). MaintenanceModeService/Guard are exported so
/// app.module.ts can wire the guard into the global APP_GUARD chain.
@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({ name: BACKUPS_QUEUE }),
  ],
  controllers: [SettingsController, ApiKeysController, BackupsController],
  providers: [
    SettingsService,
    ApiKeysService,
    BackupService,
    BackupSchedulerService,
    MaintenanceModeService,
    BackupProcessor,
    ApiKeyGuard,
  ],
  exports: [MaintenanceModeService],
})
export class SettingsModule {}
