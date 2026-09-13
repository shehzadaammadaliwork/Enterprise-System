import { HttpStatus, Injectable, Logger, StreamableFile } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { execFile as execFileCb } from 'child_process';
import { promisify } from 'util';
import { createReadStream, type Dirent } from 'fs';
import { cp, mkdir, readdir, rm, stat } from 'fs/promises';
import { join, resolve } from 'path';
import { BackupRecord } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { AppException } from '../../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { MaintenanceModeService } from './maintenance-mode.service';
import { RestoreBackupDto } from '../dto/restore-backup.dto';
import { RESTORE_CONFIRMATION_PHRASE } from '../constants/restore-confirmation.constant';
import { BackupType, BackupTrigger } from '../constants/backup.constants';

export const BACKUPS_QUEUE = 'backups';
export const RUN_BACKUP_JOB = 'run-backup';
export const RUN_RESTORE_JOB = 'run-restore';

export interface RunBackupJobData {
  backupRecordId: string;
}
export interface RunRestoreJobData {
  restoreRecordId: string;
}

const execFile = promisify(execFileCb);
const DATABASE_DUMP_FILENAME = 'database.dump';
const STORAGE_SNAPSHOT_DIRNAME = 'storage';

interface DbConnectionParams {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
}

/// Serializes a Prisma BackupRecord for API responses — Prisma's `BigInt`
/// column type doesn't survive JSON.stringify (the global ResponseInterceptor
/// would crash on it), so fileSizeBytes is stringified at this one boundary
/// rather than changing the column type and losing precision for very large
/// backups.
function serializeBackupRecord(record: BackupRecord) {
  return { ...record, fileSizeBytes: record.fileSizeBytes?.toString() ?? null };
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupRoot = resolve(
    process.env.BACKUP_ROOT ?? join(process.cwd(), 'backups'),
  );
  private readonly pgDumpPath = process.env.PG_DUMP_PATH ?? 'pg_dump';
  private readonly pgRestorePath = process.env.PG_RESTORE_PATH ?? 'pg_restore';

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly maintenanceModeService: MaintenanceModeService,
    @InjectQueue(BACKUPS_QUEUE) private readonly backupsQueue: Queue,
  ) {}

  // ---------------------------------------------------------------------
  // Backups — list / create / run / download
  // ---------------------------------------------------------------------

  async listBackups(query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
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
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getBackupOrThrow(id: string) {
    const backup = await this.prisma.backupRecord.findUnique({ where: { id } });
    if (!backup)
      throw new AppException(
        'BACKUP_NOT_FOUND',
        'Backup not found.',
        HttpStatus.NOT_FOUND,
      );
    return backup;
  }

  /// Creates the BackupRecord row up front (so a manual trigger has a real
  /// id to return/poll immediately) then enqueues the actual work — both
  /// the manual `POST /settings/backups/run` route and
  /// BackupSchedulerService's cron tick call this one method, so there is
  /// exactly one place "what a backup run actually is" is defined.
  async enqueueBackup(
    type: BackupType,
    trigger: BackupTrigger,
    triggeredByUserId?: string,
  ) {
    const record = await this.prisma.backupRecord.create({
      data: { type, trigger, triggeredByUserId },
    });
    await this.backupsQueue.add(
      RUN_BACKUP_JOB,
      { backupRecordId: record.id } satisfies RunBackupJobData,
      { jobId: record.id },
    );
    return serializeBackupRecord(record);
  }

  /// Called by BackupProcessor. Drives the BackupRecord through
  /// RUNNING -> SUCCEEDED/FAILED, then (only for a SCHEDULED trigger) prunes
  /// old scheduled backups down to the configured retention count.
  async runBackupJob(backupRecordId: string): Promise<void> {
    const record = await this.getBackupOrThrow(backupRecordId);
    await this.prisma.backupRecord.update({
      where: { id: record.id },
      data: { status: 'RUNNING' },
    });

    try {
      const { filePath, fileSizeBytes } = await this.performBackup(
        record.id,
        record.type as BackupType,
      );
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
    } catch (error) {
      this.logger.error(
        `Backup ${record.id} failed`,
        error instanceof Error ? error.stack : error,
      );
      await this.prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    }
  }

  /// The actual file-producing work, shared by the queued path
  /// (runBackupJob) and the synchronous pre-restore safety backup — writes
  /// under `${BACKUP_ROOT}/<id>/` and returns what changed for the caller
  /// to persist. Never called directly by a controller.
  private async performBackup(
    backupId: string,
    type: BackupType,
  ): Promise<{ filePath: string; fileSizeBytes: bigint }> {
    const dir = join(this.backupRoot, backupId);
    await mkdir(dir, { recursive: true });

    let totalBytes = 0n;
    if (type === 'DATABASE' || type === 'FULL') {
      totalBytes += await this.dumpDatabase(join(dir, DATABASE_DUMP_FILENAME));
    }
    if (type === 'STORAGE' || type === 'FULL') {
      totalBytes += await this.snapshotStorage(
        join(dir, STORAGE_SNAPSHOT_DIRNAME),
      );
    }
    return { filePath: `${backupId}/`, fileSizeBytes: totalBytes };
  }

  private async dumpDatabase(outFile: string): Promise<bigint> {
    const conn = this.getConnectionParams();
    await execFile(
      this.pgDumpPath,
      [
        '-h',
        conn.host,
        '-p',
        conn.port,
        '-U',
        conn.user,
        '-d',
        conn.database,
        '-Fc',
        // backup_records/restore_records are this module's own bookkeeping
        // about backups and restores, not application data to snapshot —
        // excluding them means a restore can never wipe out the very
        // restore-in-progress row (or backup history) it's in the middle of
        // recording. Confirmed necessary the hard way: a first pass without
        // this exclusion reverted the in-flight RestoreRecord mid-restore,
        // since `--clean --if-exists` on the next line reverts every table
        // present in the dump, tracking tables included.
        '--exclude-table=public.backup_records',
        '--exclude-table=public.restore_records',
        '-f',
        outFile,
      ],
      { env: { ...process.env, PGPASSWORD: conn.password } },
    );
    const { size } = await stat(outFile);
    return BigInt(size);
  }

  private async snapshotStorage(targetDir: string): Promise<bigint> {
    const sourceDir = this.storageService.getRootPath();
    await mkdir(sourceDir, { recursive: true });
    await cp(sourceDir, targetDir, { recursive: true });
    return this.dirSizeBytes(targetDir);
  }

  private async dirSizeBytes(dir: string): Promise<bigint> {
    let total = 0n;
    let entries: Dirent[];
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return 0n;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      total += entry.isDirectory()
        ? await this.dirSizeBytes(full)
        : BigInt((await stat(full)).size);
    }
    return total;
  }

  /// Only a backup with a database.dump file makes sense to download as a
  /// single file — a STORAGE-only backup has no single-file representation.
  async downloadBackup(id: string): Promise<StreamableFile> {
    const backup = await this.getBackupOrThrow(id);
    if (backup.status !== 'SUCCEEDED' || !backup.filePath) {
      throw new AppException(
        'BACKUP_NOT_READY',
        'This backup has no downloadable file yet.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (backup.type === 'STORAGE') {
      throw new AppException(
        'BACKUP_NOT_DOWNLOADABLE',
        'Storage-only backups have no single-file download — restore them via the restore action instead.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const dumpPath = join(
      this.backupRoot,
      backup.filePath,
      DATABASE_DUMP_FILENAME,
    );
    const stream = createReadStream(dumpPath);
    return new StreamableFile(stream, {
      type: 'application/octet-stream',
      disposition: `attachment; filename="backup-${backup.id}.dump"`,
    });
  }

  private async pruneScheduledBackups(): Promise<void> {
    const settings = await this.prisma.systemSettings.findFirst();
    const retentionCount = settings?.backupRetentionCount ?? 7;

    const scheduledSucceeded = await this.prisma.backupRecord.findMany({
      where: { trigger: 'SCHEDULED', status: 'SUCCEEDED' },
      orderBy: { startedAt: 'asc' },
    });
    const excess = scheduledSucceeded.length - retentionCount;
    if (excess <= 0) return;

    const toPrune = scheduledSucceeded.slice(0, excess);
    for (const backup of toPrune) {
      await rm(join(this.backupRoot, backup.id), {
        recursive: true,
        force: true,
      });
      await this.prisma.backupRecord.delete({ where: { id: backup.id } });
    }
    this.logger.log(
      `Pruned ${toPrune.length} scheduled backup(s) beyond retention of ${retentionCount}`,
    );
  }

  // ---------------------------------------------------------------------
  // Restore — the one destructive operation in this module
  // ---------------------------------------------------------------------

  async getRestoreOrThrow(id: string) {
    const restore = await this.prisma.restoreRecord.findUnique({
      where: { id },
    });
    if (!restore)
      throw new AppException(
        'RESTORE_NOT_FOUND',
        'Restore record not found.',
        HttpStatus.NOT_FOUND,
      );
    return restore;
  }

  /// Validates the typed confirmation, takes a synchronous PRE_RESTORE_SAFETY
  /// backup (aborting entirely if it fails — never restore over data that
  /// wasn't just successfully protected), then enqueues the actual restore.
  async requestRestore(
    backupId: string,
    dto: RestoreBackupDto,
    triggeredByUserId: string,
  ) {
    if (dto.confirmationBackupId !== backupId) {
      throw new AppException(
        'RESTORE_CONFIRMATION_MISMATCH',
        'confirmationBackupId does not match the backup being restored.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.confirmationPhrase !== RESTORE_CONFIRMATION_PHRASE) {
      throw new AppException(
        'RESTORE_CONFIRMATION_MISMATCH',
        'confirmationPhrase does not match the required phrase.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const backup = await this.getBackupOrThrow(backupId);
    if (backup.status !== 'SUCCEEDED') {
      throw new AppException(
        'BACKUP_NOT_READY',
        'Only a succeeded backup can be restored.',
        HttpStatus.BAD_REQUEST,
      );
    }

    const safetyBackup =
      await this.enqueueSafetyBackupAndWait(triggeredByUserId);

    const restoreRecord = await this.prisma.restoreRecord.create({
      data: {
        backupRecordId: backup.id,
        preRestoreBackupId: safetyBackup.id,
        triggeredByUserId,
      },
    });
    await this.backupsQueue.add(
      RUN_RESTORE_JOB,
      { restoreRecordId: restoreRecord.id } satisfies RunRestoreJobData,
      { jobId: restoreRecord.id },
    );
    return restoreRecord;
  }

  /// Runs the FULL safety backup inline (not through the queue — the
  /// restore flow must wait for it before proceeding) and throws if it
  /// fails, aborting the restore before anything destructive happens.
  private async enqueueSafetyBackupAndWait(triggeredByUserId: string) {
    const record = await this.prisma.backupRecord.create({
      data: { type: 'FULL', trigger: 'PRE_RESTORE_SAFETY', triggeredByUserId },
    });
    await this.prisma.backupRecord.update({
      where: { id: record.id },
      data: { status: 'RUNNING' },
    });
    try {
      const { filePath, fileSizeBytes } = await this.performBackup(
        record.id,
        'FULL',
      );
      return this.prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'SUCCEEDED',
          filePath,
          fileSizeBytes,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      await this.prisma.backupRecord.update({
        where: { id: record.id },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw new AppException(
        'PRE_RESTORE_SAFETY_BACKUP_FAILED',
        'Aborting restore: the automatic pre-restore safety backup failed.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /// Called by BackupProcessor for the run-restore job. Sets maintenance
  /// mode for the destructive window, restores the DB via pg_restore
  /// --clean --if-exists, and (only for a FULL/STORAGE backup) replaces the
  /// live storage directory wholesale with the backup's snapshot — safe
  /// because the pre-restore safety backup already captured the prior state.
  async runRestoreJob(restoreRecordId: string): Promise<void> {
    const restore = await this.getRestoreOrThrow(restoreRecordId);
    const backup = await this.getBackupOrThrow(restore.backupRecordId);
    if (!backup.filePath) {
      throw new AppException(
        'BACKUP_NOT_READY',
        'The backup being restored has no files on disk.',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.restoreRecord.update({
      where: { id: restore.id },
      data: { status: 'RUNNING' },
    });

    this.maintenanceModeService.setActive(true);
    try {
      const dir = join(this.backupRoot, backup.filePath);
      if (backup.type === 'DATABASE' || backup.type === 'FULL') {
        await this.restoreDatabase(join(dir, DATABASE_DUMP_FILENAME));
      }
      if (backup.type === 'STORAGE' || backup.type === 'FULL') {
        await this.restoreStorage(join(dir, STORAGE_SNAPSHOT_DIRNAME));
      }
      await this.prisma.restoreRecord.update({
        where: { id: restore.id },
        data: { status: 'SUCCEEDED', completedAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Restore ${restore.id} failed`,
        error instanceof Error ? error.stack : error,
      );
      await this.prisma.restoreRecord.update({
        where: { id: restore.id },
        data: {
          status: 'FAILED',
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
          completedAt: new Date(),
        },
      });
      throw error;
    } finally {
      this.maintenanceModeService.setActive(false);
    }
  }

  /// `--clean --if-exists` drops only the objects present in the dump
  /// before recreating them — not a full drop/recreate of the database —
  /// deliberately, to avoid the much riskier "tear down a live, named
  /// connection's own database" dance. Anything created after the backup
  /// point and absent from the dump is left behind; surfaced in the restore
  /// UI copy so it isn't a silent surprise.
  private async restoreDatabase(dumpFile: string): Promise<void> {
    const conn = this.getConnectionParams();
    await execFile(
      this.pgRestorePath,
      [
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
      ],
      { env: { ...process.env, PGPASSWORD: conn.password } },
    );
  }

  private async restoreStorage(sourceDir: string): Promise<void> {
    const targetDir = this.storageService.getRootPath();
    await rm(targetDir, { recursive: true, force: true });
    await cp(sourceDir, targetDir, { recursive: true });
  }

  private getConnectionParams(): DbConnectionParams {
    const url = new URL(process.env.DATABASE_URL!);
    return {
      host: url.hostname,
      port: url.port || '5432',
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: decodeURIComponent(url.pathname.slice(1)),
    };
  }
}
