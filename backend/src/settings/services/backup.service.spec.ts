import { Queue } from 'bullmq';
import { BackupService } from './backup.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { MaintenanceModeService } from './maintenance-mode.service';
import { RESTORE_CONFIRMATION_PHRASE } from '../constants/restore-confirmation.constant';

/// Everything mocked (no real DB/queue/filesystem/pg_dump), same style as
/// Finance/Calendar's service specs. Scoped to the pure business logic that
/// doesn't shell out or touch disk — the restore confirmation gate (the
/// one safety-critical check in this module) and the not-found/not-ready
/// guards. The actual pg_dump/pg_restore/fs mechanics were verified against
/// a real dev Postgres instance instead (see PROJECT_STATUS.md's Module 18
/// writeup) — this codebase has no precedent for module-level jest.mock()
/// of child_process/fs, and introducing one just for this would be a new
/// pattern for a small slice of coverage.
describe('BackupService', () => {
  let service: BackupService;
  let prisma: {
    backupRecord: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    restoreRecord: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    systemSettings: { findFirst: jest.Mock };
  };
  let storageService: { getRootPath: jest.Mock };
  let maintenanceModeService: { setActive: jest.Mock; isActive: jest.Mock };
  let queue: { add: jest.Mock };

  const SUCCEEDED_BACKUP = {
    id: 'backup-1',
    type: 'FULL',
    status: 'SUCCEEDED',
    trigger: 'MANUAL',
    filePath: 'backup-1/',
    fileSizeBytes: 1000n,
    errorMessage: null,
    triggeredByUserId: 'user-1',
    startedAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(() => {
    prisma = {
      backupRecord: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      restoreRecord: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      systemSettings: { findFirst: jest.fn() },
    };
    storageService = { getRootPath: jest.fn().mockReturnValue('/tmp/storage') };
    maintenanceModeService = {
      setActive: jest.fn(),
      isActive: jest.fn().mockReturnValue(false),
    };
    queue = { add: jest.fn().mockResolvedValue(undefined) };
    service = new BackupService(
      prisma as unknown as PrismaService,
      storageService as unknown as StorageService,
      maintenanceModeService as unknown as MaintenanceModeService,
      queue as unknown as Queue,
    );
  });

  describe('getBackupOrThrow / getRestoreOrThrow', () => {
    it('throws BACKUP_NOT_FOUND for a missing backup', async () => {
      prisma.backupRecord.findUnique.mockResolvedValue(null);
      await expect(service.getBackupOrThrow('missing')).rejects.toMatchObject({
        response: { code: 'BACKUP_NOT_FOUND' },
      });
    });

    it('throws RESTORE_NOT_FOUND for a missing restore record', async () => {
      prisma.restoreRecord.findUnique.mockResolvedValue(null);
      await expect(service.getRestoreOrThrow('missing')).rejects.toMatchObject({
        response: { code: 'RESTORE_NOT_FOUND' },
      });
    });
  });

  describe('downloadBackup', () => {
    it('rejects a backup with no file yet', async () => {
      prisma.backupRecord.findUnique.mockResolvedValue({
        ...SUCCEEDED_BACKUP,
        status: 'PENDING',
        filePath: null,
      });
      await expect(service.downloadBackup('backup-1')).rejects.toMatchObject({
        response: { code: 'BACKUP_NOT_READY' },
      });
    });

    it('rejects a STORAGE-only backup (no single-file download)', async () => {
      prisma.backupRecord.findUnique.mockResolvedValue({
        ...SUCCEEDED_BACKUP,
        type: 'STORAGE',
      });
      await expect(service.downloadBackup('backup-1')).rejects.toMatchObject({
        response: { code: 'BACKUP_NOT_DOWNLOADABLE' },
      });
    });
  });

  describe('requestRestore — confirmation gate', () => {
    it('rejects a confirmationBackupId that does not match the target backup', async () => {
      await expect(
        service.requestRestore(
          'backup-1',
          {
            confirmationBackupId: 'a-different-id',
            confirmationPhrase: RESTORE_CONFIRMATION_PHRASE,
          },
          'user-1',
        ),
      ).rejects.toMatchObject({
        response: { code: 'RESTORE_CONFIRMATION_MISMATCH' },
      });
      expect(prisma.backupRecord.findUnique).not.toHaveBeenCalled();
    });

    it('rejects a confirmationPhrase that does not match the required phrase', async () => {
      await expect(
        service.requestRestore(
          'backup-1',
          {
            confirmationBackupId: 'backup-1',
            confirmationPhrase: 'close but not it',
          },
          'user-1',
        ),
      ).rejects.toMatchObject({
        response: { code: 'RESTORE_CONFIRMATION_MISMATCH' },
      });
      expect(prisma.backupRecord.findUnique).not.toHaveBeenCalled();
    });

    it('rejects restoring a backup that has not succeeded, even with correct confirmation', async () => {
      prisma.backupRecord.findUnique.mockResolvedValue({
        ...SUCCEEDED_BACKUP,
        status: 'RUNNING',
      });
      await expect(
        service.requestRestore(
          'backup-1',
          {
            confirmationBackupId: 'backup-1',
            confirmationPhrase: RESTORE_CONFIRMATION_PHRASE,
          },
          'user-1',
        ),
      ).rejects.toMatchObject({ response: { code: 'BACKUP_NOT_READY' } });
      expect(queue.add).not.toHaveBeenCalled();
    });
  });
});
