import { StreamableFile } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { MaintenanceModeService } from './maintenance-mode.service';
import { RestoreBackupDto } from '../dto/restore-backup.dto';
import { BackupType, BackupTrigger } from '../constants/backup.constants';
export declare const BACKUPS_QUEUE = "backups";
export declare const RUN_BACKUP_JOB = "run-backup";
export declare const RUN_RESTORE_JOB = "run-restore";
export interface RunBackupJobData {
    backupRecordId: string;
}
export interface RunRestoreJobData {
    restoreRecordId: string;
}
export declare class BackupService {
    private readonly prisma;
    private readonly storageService;
    private readonly maintenanceModeService;
    private readonly backupsQueue;
    private readonly logger;
    private readonly backupRoot;
    private readonly pgDumpPath;
    private readonly pgRestorePath;
    constructor(prisma: PrismaService, storageService: StorageService, maintenanceModeService: MaintenanceModeService, backupsQueue: Queue);
    listBackups(query: PaginationQueryDto): Promise<{
        items: {
            fileSizeBytes: string | null;
            id: string;
            type: string;
            status: string;
            triggeredByUserId: string | null;
            errorMessage: string | null;
            completedAt: Date | null;
            trigger: string;
            filePath: string | null;
            startedAt: Date;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getBackupOrThrow(id: string): Promise<{
        id: string;
        type: string;
        status: string;
        triggeredByUserId: string | null;
        errorMessage: string | null;
        completedAt: Date | null;
        trigger: string;
        filePath: string | null;
        fileSizeBytes: bigint | null;
        startedAt: Date;
    }>;
    enqueueBackup(type: BackupType, trigger: BackupTrigger, triggeredByUserId?: string): Promise<{
        fileSizeBytes: string | null;
        id: string;
        type: string;
        status: string;
        triggeredByUserId: string | null;
        errorMessage: string | null;
        completedAt: Date | null;
        trigger: string;
        filePath: string | null;
        startedAt: Date;
    }>;
    runBackupJob(backupRecordId: string): Promise<void>;
    private performBackup;
    private dumpDatabase;
    private snapshotStorage;
    private dirSizeBytes;
    downloadBackup(id: string): Promise<StreamableFile>;
    private pruneScheduledBackups;
    getRestoreOrThrow(id: string): Promise<{
        id: string;
        status: string;
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
        startedAt: Date;
        backupRecordId: string;
        preRestoreBackupId: string | null;
    }>;
    requestRestore(backupId: string, dto: RestoreBackupDto, triggeredByUserId: string): Promise<{
        id: string;
        status: string;
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
        startedAt: Date;
        backupRecordId: string;
        preRestoreBackupId: string | null;
    }>;
    private enqueueSafetyBackupAndWait;
    runRestoreJob(restoreRecordId: string): Promise<void>;
    private restoreDatabase;
    private restoreStorage;
    private getConnectionParams;
}
