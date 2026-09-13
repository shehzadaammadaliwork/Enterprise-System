import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import {
  BACKUPS_QUEUE,
  BackupService,
  RUN_BACKUP_JOB,
  RUN_RESTORE_JOB,
  RunBackupJobData,
  RunRestoreJobData,
} from '../services/backup.service';

/// Both backup and restore work land on the same queue (they're mutually
/// exclusive by nature — a restore only ever follows a completed backup —
/// and neither needs its own dedicated worker), distinguished by job name.
@Processor(BACKUPS_QUEUE)
export class BackupProcessor extends WorkerHost {
  constructor(private readonly backupService: BackupService) {
    super();
  }

  async process(job: Job<RunBackupJobData | RunRestoreJobData>): Promise<void> {
    if (job.name === RUN_BACKUP_JOB) {
      await this.backupService.runBackupJob(
        (job.data as RunBackupJobData).backupRecordId,
      );
      return;
    }
    if (job.name === RUN_RESTORE_JOB) {
      await this.backupService.runRestoreJob(
        (job.data as RunRestoreJobData).restoreRecordId,
      );
      return;
    }
  }
}
