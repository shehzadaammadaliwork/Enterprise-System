import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { StorageService } from '../../common/storage/storage.service';
import { UpdateSettingsDto } from '../dto/update-settings.dto';
import { BackupSchedulerService } from './backup-scheduler.service';

const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const LOGO_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/svg+xml',
  'image/webp',
];

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly backupSchedulerService: BackupSchedulerService,
  ) {}

  /// Same findFirst()-or-create() singleton convention as
  /// OrganizationService.getCompanyProfile() — no DB-level uniqueness
  /// constraint, just an app-level "there is only ever one row" rule.
  async getSettings() {
    const existing = await this.prisma.systemSettings.findFirst();
    if (existing) return existing;
    return this.prisma.systemSettings.create({ data: {} });
  }

  async updateSettings(dto: UpdateSettingsDto, updatedByUserId: string) {
    const current = await this.getSettings();
    const updated = await this.prisma.systemSettings.update({
      where: { id: current.id },
      data: { ...dto, updatedByUserId },
    });

    if (
      dto.backupSchedule !== undefined &&
      dto.backupSchedule !== current.backupSchedule
    ) {
      this.backupSchedulerService.reschedule(dto.backupSchedule);
    }
    return updated;
  }

  async uploadLogo(file: Express.Multer.File, updatedByUserId: string) {
    const current = await this.getSettings();
    const stored = await this.storageService.save({
      folder: 'settings/branding',
      fileName: file.originalname,
      buffer: file.buffer,
      mimeType: file.mimetype,
      allowedMimeTypes: LOGO_ALLOWED_MIME_TYPES,
      maxSizeBytes: LOGO_MAX_SIZE_BYTES,
    });

    if (current.brandLogoKey) {
      await this.storageService.delete(current.brandLogoKey);
    }
    return this.prisma.systemSettings.update({
      where: { id: current.id },
      data: { brandLogoKey: stored.key, updatedByUserId },
    });
  }

  async deleteLogo(updatedByUserId: string) {
    const current = await this.getSettings();
    if (current.brandLogoKey) {
      await this.storageService.delete(current.brandLogoKey);
    }
    return this.prisma.systemSettings.update({
      where: { id: current.id },
      data: { brandLogoKey: null, updatedByUserId },
    });
  }
}
