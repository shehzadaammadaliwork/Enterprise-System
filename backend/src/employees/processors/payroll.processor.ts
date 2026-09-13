import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PayrollService, PAYROLL_QUEUE } from '../services/payroll.service';

interface GeneratePayrollJobData {
  runId: string;
}

/// BullMQ worker for Module 5's "Monthly payroll generation ... run as a
/// background job" requirement — PayrollService.triggerRun enqueues here,
/// this just hands the job off to the actual generation logic.
@Processor(PAYROLL_QUEUE)
export class PayrollProcessor extends WorkerHost {
  constructor(private readonly payrollService: PayrollService) {
    super();
  }

  async process(job: Job<GeneratePayrollJobData>): Promise<void> {
    await this.payrollService.processRun(job.data.runId);
  }
}
