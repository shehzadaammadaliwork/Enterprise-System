import { OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BackupService } from './backup.service';
export declare class BackupSchedulerService implements OnModuleInit {
    private readonly schedulerRegistry;
    private readonly prisma;
    private readonly backupService;
    private readonly logger;
    constructor(schedulerRegistry: SchedulerRegistry, prisma: PrismaService, backupService: BackupService);
    onModuleInit(): Promise<void>;
    reschedule(cronExpression: string | null): void;
    private register;
    private unregister;
}
