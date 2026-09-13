import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { BackupService, RunBackupJobData, RunRestoreJobData } from '../services/backup.service';
export declare class BackupProcessor extends WorkerHost {
    private readonly backupService;
    constructor(backupService: BackupService);
    process(job: Job<RunBackupJobData | RunRestoreJobData>): Promise<void>;
}
