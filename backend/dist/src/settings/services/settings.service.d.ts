import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { BackupSchedulerService } from './backup-scheduler.service';
export declare class SettingsService {
    private readonly prisma;
    private readonly storageService;
    private readonly backupSchedulerService;
    constructor(prisma: PrismaService, storageService: StorageService, backupSchedulerService: BackupSchedulerService);
    getSettings(): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedByUserId: string | null;
        brandPrimaryColor: string | null;
        timezone: string;
        currencyCode: string;
        currencyLocale: string;
        backupSchedule: string | null;
        backupRetentionCount: number;
        brandLogoKey: string | null;
    }>;
    updateSettings(dto: UpdateSettingsDto, updatedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedByUserId: string | null;
        brandPrimaryColor: string | null;
        timezone: string;
        currencyCode: string;
        currencyLocale: string;
        backupSchedule: string | null;
        backupRetentionCount: number;
        brandLogoKey: string | null;
    }>;
    uploadLogo(file: Express.Multer.File, updatedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedByUserId: string | null;
        brandPrimaryColor: string | null;
        timezone: string;
        currencyCode: string;
        currencyLocale: string;
        backupSchedule: string | null;
        backupRetentionCount: number;
        brandLogoKey: string | null;
    }>;
    deleteLogo(updatedByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        updatedByUserId: string | null;
        brandPrimaryColor: string | null;
        timezone: string;
        currencyCode: string;
        currencyLocale: string;
        backupSchedule: string | null;
        backupRetentionCount: number;
        brandLogoKey: string | null;
    }>;
}
