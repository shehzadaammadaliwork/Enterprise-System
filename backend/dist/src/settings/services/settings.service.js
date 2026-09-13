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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const storage_service_1 = require("../../common/storage/storage.service");
const backup_scheduler_service_1 = require("./backup-scheduler.service");
const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const LOGO_ALLOWED_MIME_TYPES = [
    'image/png',
    'image/jpeg',
    'image/svg+xml',
    'image/webp',
];
let SettingsService = class SettingsService {
    prisma;
    storageService;
    backupSchedulerService;
    constructor(prisma, storageService, backupSchedulerService) {
        this.prisma = prisma;
        this.storageService = storageService;
        this.backupSchedulerService = backupSchedulerService;
    }
    async getSettings() {
        const existing = await this.prisma.systemSettings.findFirst();
        if (existing)
            return existing;
        return this.prisma.systemSettings.create({ data: {} });
    }
    async updateSettings(dto, updatedByUserId) {
        const current = await this.getSettings();
        const updated = await this.prisma.systemSettings.update({
            where: { id: current.id },
            data: { ...dto, updatedByUserId },
        });
        if (dto.backupSchedule !== undefined &&
            dto.backupSchedule !== current.backupSchedule) {
            this.backupSchedulerService.reschedule(dto.backupSchedule);
        }
        return updated;
    }
    async uploadLogo(file, updatedByUserId) {
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
    async deleteLogo(updatedByUserId) {
        const current = await this.getSettings();
        if (current.brandLogoKey) {
            await this.storageService.delete(current.brandLogoKey);
        }
        return this.prisma.systemSettings.update({
            where: { id: current.id },
            data: { brandLogoKey: null, updatedByUserId },
        });
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        storage_service_1.StorageService,
        backup_scheduler_service_1.BackupSchedulerService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map