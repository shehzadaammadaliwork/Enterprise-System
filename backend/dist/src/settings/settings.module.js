"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsModule = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const bullmq_1 = require("@nestjs/bullmq");
const settings_controller_1 = require("./controllers/settings.controller");
const api_keys_controller_1 = require("./controllers/api-keys.controller");
const backups_controller_1 = require("./controllers/backups.controller");
const settings_service_1 = require("./services/settings.service");
const api_keys_service_1 = require("./services/api-keys.service");
const backup_service_1 = require("./services/backup.service");
const backup_scheduler_service_1 = require("./services/backup-scheduler.service");
const maintenance_mode_service_1 = require("./services/maintenance-mode.service");
const backup_processor_1 = require("./processors/backup.processor");
const api_key_guard_1 = require("./guards/api-key.guard");
let SettingsModule = class SettingsModule {
};
exports.SettingsModule = SettingsModule;
exports.SettingsModule = SettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            schedule_1.ScheduleModule.forRoot(),
            bullmq_1.BullModule.registerQueue({ name: backup_service_1.BACKUPS_QUEUE }),
        ],
        controllers: [settings_controller_1.SettingsController, api_keys_controller_1.ApiKeysController, backups_controller_1.BackupsController],
        providers: [
            settings_service_1.SettingsService,
            api_keys_service_1.ApiKeysService,
            backup_service_1.BackupService,
            backup_scheduler_service_1.BackupSchedulerService,
            maintenance_mode_service_1.MaintenanceModeService,
            backup_processor_1.BackupProcessor,
            api_key_guard_1.ApiKeyGuard,
        ],
        exports: [maintenance_mode_service_1.MaintenanceModeService],
    })
], SettingsModule);
//# sourceMappingURL=settings.module.js.map