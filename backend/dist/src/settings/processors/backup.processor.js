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
exports.BackupProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const backup_service_1 = require("../services/backup.service");
let BackupProcessor = class BackupProcessor extends bullmq_1.WorkerHost {
    backupService;
    constructor(backupService) {
        super();
        this.backupService = backupService;
    }
    async process(job) {
        if (job.name === backup_service_1.RUN_BACKUP_JOB) {
            await this.backupService.runBackupJob(job.data.backupRecordId);
            return;
        }
        if (job.name === backup_service_1.RUN_RESTORE_JOB) {
            await this.backupService.runRestoreJob(job.data.restoreRecordId);
            return;
        }
    }
};
exports.BackupProcessor = BackupProcessor;
exports.BackupProcessor = BackupProcessor = __decorate([
    (0, bullmq_1.Processor)(backup_service_1.BACKUPS_QUEUE),
    __metadata("design:paramtypes", [backup_service_1.BackupService])
], BackupProcessor);
//# sourceMappingURL=backup.processor.js.map