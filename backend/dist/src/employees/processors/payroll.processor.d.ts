import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PayrollService } from '../services/payroll.service';
interface GeneratePayrollJobData {
    runId: string;
}
export declare class PayrollProcessor extends WorkerHost {
    private readonly payrollService;
    constructor(payrollService: PayrollService);
    process(job: Job<GeneratePayrollJobData>): Promise<void>;
}
export {};
