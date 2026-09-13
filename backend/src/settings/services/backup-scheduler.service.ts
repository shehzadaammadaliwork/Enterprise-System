import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BackupService } from './backup.service';

const SCHEDULED_BACKUP_JOB_NAME = 'scheduled-backup';

/// Owns the one dynamic cron job this codebase has (everything else uses
/// BullMQ delayed/immediate jobs — see CLAUDE.md/PROJECT_STATUS.md's Module
/// 18 writeup for why a cron-shaped, admin-editable schedule is a better
/// fit here than BullMQ's `repeat` option). SchedulerRegistry jobs are
/// in-memory only and do not survive a process restart, so onModuleInit
/// must re-read the persisted schedule and re-register on every boot —
/// skipping that would make a configured schedule silently stop firing
/// after any restart/deploy.
@Injectable()
export class BackupSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(BackupSchedulerService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly prisma: PrismaService,
    private readonly backupService: BackupService,
  ) {}

  async onModuleInit(): Promise<void> {
    const settings = await this.prisma.systemSettings.findFirst();
    if (settings?.backupSchedule) {
      this.register(settings.backupSchedule);
    }
  }

  /// Called by SettingsService.updateSettings whenever backupSchedule
  /// actually changes. `null` disables scheduled backups entirely. Not
  /// actually async (registration is synchronous) — kept a plain method
  /// rather than an async one with nothing to await.
  reschedule(cronExpression: string | null): void {
    this.unregister();
    if (cronExpression) {
      this.register(cronExpression);
    }
  }

  private register(cronExpression: string): void {
    const job = new CronJob(cronExpression, () => {
      this.backupService
        .enqueueBackup('FULL', 'SCHEDULED')
        .catch((error) =>
          this.logger.error('Failed to enqueue scheduled backup', error),
        );
    });
    this.schedulerRegistry.addCronJob(SCHEDULED_BACKUP_JOB_NAME, job);
    job.start();
    this.logger.log(`Scheduled backup cron registered: ${cronExpression}`);
  }

  private unregister(): void {
    if (this.schedulerRegistry.doesExist('cron', SCHEDULED_BACKUP_JOB_NAME)) {
      this.schedulerRegistry.deleteCronJob(SCHEDULED_BACKUP_JOB_NAME);
    }
  }
}
