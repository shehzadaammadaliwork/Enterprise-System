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
var BackupSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackupSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const cron_1 = require("cron");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const backup_service_1 = require("./backup.service");
const SCHEDULED_BACKUP_JOB_NAME = 'scheduled-backup';
let BackupSchedulerService = BackupSchedulerService_1 = class BackupSchedulerService {
    schedulerRegistry;
    prisma;
    backupService;
    logger = new common_1.Logger(BackupSchedulerService_1.name);
    constructor(schedulerRegistry, prisma, backupService) {
        this.schedulerRegistry = schedulerRegistry;
        this.prisma = prisma;
        this.backupService = backupService;
    }
    async onModuleInit() {
        const settings = await this.prisma.systemSettings.findFirst();
        if (settings?.backupSchedule) {
            this.register(settings.backupSchedule);
        }
    }
    reschedule(cronExpression) {
        this.unregister();
        if (cronExpression) {
            this.register(cronExpression);
        }
    }
    register(cronExpression) {
        const job = new cron_1.CronJob(cronExpression, () => {
            this.backupService
                .enqueueBackup('FULL', 'SCHEDULED')
                .catch((error) => this.logger.error('Failed to enqueue scheduled backup', error));
        });
        this.schedulerRegistry.addCronJob(SCHEDULED_BACKUP_JOB_NAME, job);
        job.start();
        this.logger.log(`Scheduled backup cron registered: ${cronExpression}`);
    }
    unregister() {
        if (this.schedulerRegistry.doesExist('cron', SCHEDULED_BACKUP_JOB_NAME)) {
            this.schedulerRegistry.deleteCronJob(SCHEDULED_BACKUP_JOB_NAME);
        }
    }
};
exports.BackupSchedulerService = BackupSchedulerService;
exports.BackupSchedulerService = BackupSchedulerService = BackupSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [schedule_1.SchedulerRegistry,
        prisma_service_1.PrismaService,
        backup_service_1.BackupService])
], BackupSchedulerService);
//# sourceMappingURL=backup-scheduler.service.js.map