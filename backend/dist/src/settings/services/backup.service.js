"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BackupService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupService = exports.RUN_RESTORE_JOB = exports.RUN_BACKUP_JOB = exports.BACKUPS_QUEUE = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const child_process_1 = require("child_process");
const util_1 = require("util");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const storage_service_1 = require("../../common/storage/storage.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const maintenance_mode_service_1 = require("./maintenance-mode.service");
const restore_confirmation_constant_1 = require("../constants/restore-confirmation.constant");
exports.BACKUPS_QUEUE = 'backups';
exports.RUN_BACKUP_JOB = 'run-backup';
exports.RUN_RESTORE_JOB = 'run-restore';
const execFile = (0, util_1.promisify)(child_process_1.execFile);
const DATABASE_DUMP_FILENAME = 'database.dump';
const STORAGE_SNAPSHOT_DIRNAME = 'storage';
function serializeBackupRecord(record) {
    return { ...record, fileSizeBytes: record.fileSizeBytes?.toString() ?? null };
}
let BackupService = BackupService_1 = class BackupService {
    prisma;
    storageService;
    maintenanceModeService;
    backupsQueue;
    logger = new common_1.Logger(BackupService_1.name);
    backupRoot = (0, path_1.resolve)(process.env.BACKUP_ROOT ?? (0, path_1.join)(process.cwd(), 'backups'));
    pgDumpPath = process.env.PG_DUMP_PATH ?? 'pg_dump';
    pgRestorePath = process.env.PG_RESTORE_PATH ?? 'pg_restore';
    constructor(prisma, storageService, maintenanceModeService, backupsQueue) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.maintenanceModeService = maintenanceModeService;
        this.backupsQueue = backupsQueue;
    }
    async listBackups(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const [items, total] = await Promise.all([
            this.prisma.backupRecord.findMany({
                skip,
                take,
                orderBy: { startedAt: 'desc' },
            }),
            this.prisma.backupRecord.count(),
        ]);
        return {
            items: items.map(serializeBackupRecord),
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getBackupOrThrow(id) {
        const backup = await this.prisma.backupRecord.findUnique({ where: { id } });
        if (!backup)
            throw new app_exception_1.AppException('BACKUP_NOT_FOUND', 'Backup not found.', common_1.HttpStatus.NOT_FOUND);
        return backup;
    }
    async enqueueBackup(type, trigger, triggeredByUserId) {
        const record = await this.prisma.backupRecord.create({
            data: { type, trigger, triggeredByUserId },
        });
        await this.backupsQueue.add(exports.RUN_BACKUP_JOB, { backupRecordId: record.id }, { jobId: record.id });
        return serializeBackupRecord(record);
    }
    async runBackupJob(backupRecordId) {
        const record = await this.getBackupOrThrow(backupRecordId);
        await this.prisma.backupRecord.update({
            where: { id: record.id },
            data: { status: 'RUNNING' },
        });
        try {
            const { filePath, fileSizeBytes } = await this.performBackup(record.id, record.type);
            await this.prisma.backupRecord.update({
                where: { id: record.id },
                data: {
                    status: 'SUCCEEDED',
                    filePath,
                    fileSizeBytes,
                    completedAt: new Date(),
                },
            });
            if (record.trigger === 'SCHEDULED') {
                await this.pruneScheduledBackups();
            }
        }
        catch (error) {
            this.logger.error(`Backup ${record.id} failed`, error instanceof Error ? error.stack : error);
            await this.prisma.backupRecord.update({
                where: { id: record.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                },
            });
            throw error;
        }
    }
    async performBackup(backupId, type) {
        const dir = (0, path_1.join)(this.backupRoot, backupId);
        await (0, promises_1.mkdir)(dir, { recursive: true });
        let totalBytes = 0n;
        if (type === 'DATABASE' || type === 'FULL') {
            totalBytes += await this.dumpDatabase((0, path_1.join)(dir, DATABASE_DUMP_FILENAME));
        }
        if (type === 'STORAGE' || type === 'FULL') {
            totalBytes += await this.snapshotStorage((0, path_1.join)(dir, STORAGE_SNAPSHOT_DIRNAME));
        }
        return { filePath: `${backupId}/`, fileSizeBytes: totalBytes };
    }
    async dumpDatabase(outFile) {
        const conn = this.getConnectionParams();
        await execFile(this.pgDumpPath, [
            '-h',
            conn.host,
            '-p',
            conn.port,
            '-U',
            conn.user,
            '-d',
            conn.database,
            '-Fc',
            '--exclude-table=public.backup_records',
            '--exclude-table=public.restore_records',
            '-f',
            outFile,
        ], { env: { ...process.env, PGPASSWORD: conn.password } });
        const { size } = await (0, promises_1.stat)(outFile);
        return BigInt(size);
    }
    async snapshotStorage(targetDir) {
        const sourceDir = this.storageService.getRootPath();
        await (0, promises_1.mkdir)(sourceDir, { recursive: true });
        await (0, promises_1.cp)(sourceDir, targetDir, { recursive: true });
        return this.dirSizeBytes(targetDir);
    }
    async dirSizeBytes(dir) {
        let total = 0n;
        let entries;
        try {
            entries = await (0, promises_1.readdir)(dir, { withFileTypes: true });
        }
        catch {
            return 0n;
        }
        for (const entry of entries) {
            const full = (0, path_1.join)(dir, entry.name);
            total += entry.isDirectory()
                ? await this.dirSizeBytes(full)
                : BigInt((await (0, promises_1.stat)(full)).size);
        }
        return total;
    }
    async downloadBackup(id) {
        const backup = await this.getBackupOrThrow(id);
        if (backup.status !== 'SUCCEEDED' || !backup.filePath) {
            throw new app_exception_1.AppException('BACKUP_NOT_READY', 'This backup has no downloadable file yet.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (backup.type === 'STORAGE') {
            throw new app_exception_1.AppException('BACKUP_NOT_DOWNLOADABLE', 'Storage-only backups have no single-file download — restore them via the restore action instead.', common_1.HttpStatus.BAD_REQUEST);
        }
        const dumpPath = (0, path_1.join)(this.backupRoot, backup.filePath, DATABASE_DUMP_FILENAME);
        const stream = (0, fs_1.createReadStream)(dumpPath);
        return new common_1.StreamableFile(stream, {
            type: 'application/octet-stream',
            disposition: `attachment; filename="backup-${backup.id}.dump"`,
        });
    }
    async pruneScheduledBackups() {
        const settings = await this.prisma.systemSettings.findFirst();
        const retentionCount = settings?.backupRetentionCount ?? 7;
        const scheduledSucceeded = await this.prisma.backupRecord.findMany({
            where: { trigger: 'SCHEDULED', status: 'SUCCEEDED' },
            orderBy: { startedAt: 'asc' },
        });
        const excess = scheduledSucceeded.length - retentionCount;
        if (excess <= 0)
            return;
        const toPrune = scheduledSucceeded.slice(0, excess);
        for (const backup of toPrune) {
            await (0, promises_1.rm)((0, path_1.join)(this.backupRoot, backup.id), {
                recursive: true,
                force: true,
            });
            await this.prisma.backupRecord.delete({ where: { id: backup.id } });
        }
        this.logger.log(`Pruned ${toPrune.length} scheduled backup(s) beyond retention of ${retentionCount}`);
    }
    async getRestoreOrThrow(id) {
        const restore = await this.prisma.restoreRecord.findUnique({
            where: { id },
        });
        if (!restore)
            throw new app_exception_1.AppException('RESTORE_NOT_FOUND', 'Restore record not found.', common_1.HttpStatus.NOT_FOUND);
        return restore;
    }
    async requestRestore(backupId, dto, triggeredByUserId) {
        if (dto.confirmationBackupId !== backupId) {
            throw new app_exception_1.AppException('RESTORE_CONFIRMATION_MISMATCH', 'confirmationBackupId does not match the backup being restored.', common_1.HttpStatus.BAD_REQUEST);
        }
        if (dto.confirmationPhrase !== restore_confirmation_constant_1.RESTORE_CONFIRMATION_PHRASE) {
            throw new app_exception_1.AppException('RESTORE_CONFIRMATION_MISMATCH', 'confirmationPhrase does not match the required phrase.', common_1.HttpStatus.BAD_REQUEST);
        }
        const backup = await this.getBackupOrThrow(backupId);
        if (backup.status !== 'SUCCEEDED') {
            throw new app_exception_1.AppException('BACKUP_NOT_READY', 'Only a succeeded backup can be restored.', common_1.HttpStatus.BAD_REQUEST);
        }
        const safetyBackup = await this.enqueueSafetyBackupAndWait(triggeredByUserId);
        const restoreRecord = await this.prisma.restoreRecord.create({
            data: {
                backupRecordId: backup.id,
                preRestoreBackupId: safetyBackup.id,
                triggeredByUserId,
            },
        });
        await this.backupsQueue.add(exports.RUN_RESTORE_JOB, { restoreRecordId: restoreRecord.id }, { jobId: restoreRecord.id });
        return restoreRecord;
    }
    async enqueueSafetyBackupAndWait(triggeredByUserId) {
        const record = await this.prisma.backupRecord.create({
            data: { type: 'FULL', trigger: 'PRE_RESTORE_SAFETY', triggeredByUserId },
        });
        await this.prisma.backupRecord.update({
            where: { id: record.id },
            data: { status: 'RUNNING' },
        });
        try {
            const { filePath, fileSizeBytes } = await this.performBackup(record.id, 'FULL');
            return this.prisma.backupRecord.update({
                where: { id: record.id },
                data: {
                    status: 'SUCCEEDED',
                    filePath,
                    fileSizeBytes,
                    completedAt: new Date(),
                },
            });
        }
        catch (error) {
            await this.prisma.backupRecord.update({
                where: { id: record.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                },
            });
            throw new app_exception_1.AppException('PRE_RESTORE_SAFETY_BACKUP_FAILED', 'Aborting restore: the automatic pre-restore safety backup failed.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async runRestoreJob(restoreRecordId) {
        const restore = await this.getRestoreOrThrow(restoreRecordId);
        const backup = await this.getBackupOrThrow(restore.backupRecordId);
        if (!backup.filePath) {
            throw new app_exception_1.AppException('BACKUP_NOT_READY', 'The backup being restored has no files on disk.', common_1.HttpStatus.BAD_REQUEST);
        }
        await this.prisma.restoreRecord.update({
            where: { id: restore.id },
            data: { status: 'RUNNING' },
        });
        this.maintenanceModeService.setActive(true);
        try {
            const dir = (0, path_1.join)(this.backupRoot, backup.filePath);
            if (backup.type === 'DATABASE' || backup.type === 'FULL') {
                await this.restoreDatabase((0, path_1.join)(dir, DATABASE_DUMP_FILENAME));
            }
            if (backup.type === 'STORAGE' || backup.type === 'FULL') {
                await this.restoreStorage((0, path_1.join)(dir, STORAGE_SNAPSHOT_DIRNAME));
            }
            await this.prisma.restoreRecord.update({
                where: { id: restore.id },
                data: { status: 'SUCCEEDED', completedAt: new Date() },
            });
        }
        catch (error) {
            this.logger.error(`Restore ${restore.id} failed`, error instanceof Error ? error.stack : error);
            await this.prisma.restoreRecord.update({
                where: { id: restore.id },
                data: {
                    status: 'FAILED',
                    errorMessage: error instanceof Error ? error.message : 'Unknown error',
                    completedAt: new Date(),
                },
            });
            throw error;
        }
        finally {
            this.maintenanceModeService.setActive(false);
        }
    }
    async restoreDatabase(dumpFile) {
        const conn = this.getConnectionParams();
        await execFile(this.pgRestorePath, [
            '--clean',
            '--if-exists',
            '--no-owner',
            '-h',
            conn.host,
            '-p',
            conn.port,
            '-U',
            conn.user,
            '-d',
            conn.database,
            dumpFile,
        ], { env: { ...process.env, PGPASSWORD: conn.password } });
    }
    async restoreStorage(sourceDir) {
        const targetDir = this.storageService.getRootPath();
        await (0, promises_1.rm)(targetDir, { recursive: true, force: true });
        await (0, promises_1.cp)(sourceDir, targetDir, { recursive: true });
    }
    getConnectionParams() {
        const url = new URL(process.env.DATABASE_URL);
        return {
            host: url.hostname,
            port: url.port || '5432',
            user: decodeURIComponent(url.username),
            password: decodeURIComponent(url.password),
            database: decodeURIComponent(url.pathname.slice(1)),
        };
    }
};
exports.BackupService = BackupService;
exports.BackupService = BackupService = BackupService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)(exports.BACKUPS_QUEUE)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        maintenance_mode_service_1.MaintenanceModeService,
        bullmq_2.Queue])
], BackupService);
//# sourceMappingURL=backup.service.js.map