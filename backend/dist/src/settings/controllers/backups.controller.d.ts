import { BackupService } from '../services/backup.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { RunBackupDto } from '../dto/run-backup.dto';
import { RestoreBackupDto } from '../dto/restore-backup.dto';
export declare class BackupsController {
    private readonly backupService;
    constructor(backupService: BackupService);
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
    runBackup(dto: RunBackupDto, user: AuthenticatedUser): Promise<{
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
    downloadBackup(id: string): Promise<import("@nestjs/common").StreamableFile>;
    restoreBackup(id: string, dto: RestoreBackupDto, user: AuthenticatedUser): Promise<{
        id: string;
        status: string;
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
        startedAt: Date;
        backupRecordId: string;
        preRestoreBackupId: string | null;
    }>;
    getRestore(id: string): Promise<{
        id: string;
        status: string;
        triggeredByUserId: string;
        errorMessage: string | null;
        completedAt: Date | null;
        startedAt: Date;
        backupRecordId: string;
        preRestoreBackupId: string | null;
    }>;
}
