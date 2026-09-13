import { SettingsService } from '../services/settings.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
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
    updateSettings(dto: UpdateSettingsDto, user: AuthenticatedUser): Promise<{
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
    uploadLogo(file: Express.Multer.File | undefined, user: AuthenticatedUser): Promise<{
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
    deleteLogo(user: AuthenticatedUser): Promise<{
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
