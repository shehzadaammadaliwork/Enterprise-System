import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PayrollRunScope, PayrollRunStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FieldEncryptionService } from '../../common/security/encryption.service';
import { AppException } from '../../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { EventsGateway } from '../../common/websocket/events.gateway';
import { SetPayrollAdjustmentsDto } from '../dto/set-payroll-adjustments.dto';

export const PAYROLL_QUEUE = 'payroll';

@Injectable()
export class PayrollService {
  private readonly logger = new Logger(PayrollService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
    private readonly employeesService: EmployeesService,
    private readonly eventsGateway: EventsGateway,
    @InjectQueue(PAYROLL_QUEUE) private readonly payrollQueue: Queue,
  ) {}

  /// Which of `employeeIds` already have a payslip for this exact period
  /// from a run that reached PROCESSING or COMPLETED — the per-employee
  /// analog of the old (and wrong) per-period "already exists" check.
  /// PayslipItem is the source of truth for "who actually got paid" (see
  /// the doc comment on PayrollRun.selectedEmployeeIds), so this looks
  /// there rather than at run.scope/selectedEmployeeIds, which only
  /// describe one run's original target list.
  private async getEmployeeIdsWithPayrollRecord(
    month: number,
    year: number,
    employeeIds: string[],
  ): Promise<Set<string>> {
    if (employeeIds.length === 0) return new Set();
    const items = await this.prisma.payslipItem.findMany({
      where: {
        employeeId: { in: employeeIds },
        payrollRun: {
          month,
          year,
          status: {
            in: [PayrollRunStatus.PROCESSING, PayrollRunStatus.COMPLETED],
          },
        },
      },
      select: { employeeId: true },
    });
    return new Set(items.map((item) => item.employeeId));
  }

  /// A period can have more than one run over time (e.g. an initial run for
  /// most employees, then a later top-up run for whoever was onboarded
  /// mid-cycle) — so "already exists" is scoped per employee, not per
  /// period: only employees who don't yet have a payslip for this exact
  /// (month, year) are ever targeted by a new run. If every requested
  /// employee already has one, there's nothing left to run and this
  /// rejects the same way the old period-level check used to.
  async triggerRun(
    month: number,
    year: number,
    triggeredByUserId: string,
    scope: PayrollRunScope = PayrollRunScope.ALL_ACTIVE,
    employeeIds?: string[],
  ) {
    let requestedIds: string[];
    if (scope === PayrollRunScope.SELECTED) {
      const ids = [...new Set(employeeIds ?? [])];
      const matched = await this.prisma.employee.count({
        where: { id: { in: ids } },
      });
      if (matched !== ids.length) {
        throw new AppException(
          'INVALID_EMPLOYEE_SELECTION',
          'One or more selected employees could not be found.',
          HttpStatus.BAD_REQUEST,
        );
      }
      requestedIds = ids;
    } else {
      const activeEmployees = await this.prisma.employee.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true },
      });
      requestedIds = activeEmployees.map((employee) => employee.id);
    }

    const alreadyCoveredIds = await this.getEmployeeIdsWithPayrollRecord(
      month,
      year,
      requestedIds,
    );
    const remainingIds = requestedIds.filter(
      (id) => !alreadyCoveredIds.has(id),
    );
    const skippedEmployeeIds = requestedIds.filter((id) =>
      alreadyCoveredIds.has(id),
    );

    if (remainingIds.length === 0) {
      throw new AppException(
        'PAYROLL_RUN_EXISTS',
        `A payroll run for ${month}/${year} already exists.`,
        HttpStatus.CONFLICT,
      );
    }

    // Only fall back to an explicit SELECTED run (targeting just the
    // not-yet-covered employees) when an ALL_ACTIVE request actually needs
    // to skip someone — a fresh period with nothing to skip keeps the
    // original dynamic ALL_ACTIVE scope (re-evaluated at process time)
    // exactly as before.
    const runScope: PayrollRunScope =
      scope === PayrollRunScope.SELECTED || skippedEmployeeIds.length > 0
        ? PayrollRunScope.SELECTED
        : PayrollRunScope.ALL_ACTIVE;
    const runSelectedEmployeeIds =
      runScope === PayrollRunScope.SELECTED ? remainingIds : [];

    const run = await this.prisma.payrollRun.create({
      data: {
        month,
        year,
        triggeredByUserId,
        scope: runScope,
        selectedEmployeeIds: runSelectedEmployeeIds,
      },
    });
    await this.payrollQueue.add(
      'generate',
      { runId: run.id },
      { jobId: run.id },
    );
    return { ...run, skippedEmployeeIds };
  }

  async listRuns(query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.payrollRun.findMany({
        skip,
        take,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      this.prisma.payrollRun.count(),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getRun(id: string) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id },
      include: {
        payslips: {
          include: {
            employee: {
              select: {
                id: true,
                designation: true,
                user: {
                  select: { firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
      },
    });
    if (!run)
      throw new AppException(
        'PAYROLL_RUN_NOT_FOUND',
        'Payroll run not found.',
        HttpStatus.NOT_FOUND,
      );
    return {
      ...run,
      payslips: run.payslips.map((p) => this.toPublicPayslip(p)),
    };
  }

  async getPayslipsForEmployee(employeeId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = { employeeId };
    const [items, total] = await Promise.all([
      this.prisma.payslipItem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: { payrollRun: true },
      }),
      this.prisma.payslipItem.count({ where }),
    ]);
    return {
      items: items.map((p) => this.toPublicPayslip(p)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  /// A period's adjustments (and the run itself) are locked for editing once
  /// its PayrollRun reaches PROCESSING or COMPLETED — "no editing a payslip
  /// after the run has completed."
  private async isPeriodLocked(month: number, year: number): Promise<boolean> {
    const run = await this.prisma.payrollRun.findFirst({
      where: {
        month,
        year,
        status: {
          in: [PayrollRunStatus.PROCESSING, PayrollRunStatus.COMPLETED],
        },
      },
      select: { id: true },
    });
    return !!run;
  }

  /// Preview for the "Adjustments" step on Run Payroll: each targeted active
  /// employee's base pay plus any bonus/deduction already staged for this
  /// period (0 if none staged yet).
  async getAdjustments(month: number, year: number, employeeIds?: string[]) {
    const locked = await this.isPeriodLocked(month, year);

    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(employeeIds?.length ? { id: { in: employeeIds } } : {}),
      },
      select: {
        id: true,
        designation: true,
        salaryEncrypted: true,
        user: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const existingAdjustments = await this.prisma.payrollAdjustment.findMany({
      where: {
        month,
        year,
        employeeId: { in: employees.map((e) => e.id) },
      },
    });
    const adjustmentByEmployeeId = new Map(
      existingAdjustments.map((a) => [a.employeeId, a]),
    );

    const items = employees.map((employee) => {
      const adjustment = adjustmentByEmployeeId.get(employee.id);
      return {
        employeeId: employee.id,
        designation: employee.designation,
        user: employee.user,
        basePay: Number(this.encryption.decrypt(employee.salaryEncrypted)),
        bonus: adjustment
          ? Number(this.encryption.decrypt(adjustment.bonusEncrypted))
          : 0,
        deduction: adjustment
          ? Number(this.encryption.decrypt(adjustment.deductionEncrypted))
          : 0,
      };
    });

    return { locked, items };
  }

  /// Stages bonus/deduction for a period, read back by processRun when that
  /// period's run is triggered. Rejected once the period is locked.
  async setAdjustments(dto: SetPayrollAdjustmentsDto, userId: string) {
    const { month, year, adjustments } = dto;

    if (await this.isPeriodLocked(month, year)) {
      throw new AppException(
        'PAYROLL_PERIOD_LOCKED',
        `Payroll for ${month}/${year} has already been run — its adjustments are locked.`,
        HttpStatus.CONFLICT,
      );
    }

    const ids = adjustments.map((a) => a.employeeId);
    const matched = await this.prisma.employee.count({
      where: { id: { in: ids } },
    });
    if (matched !== new Set(ids).size) {
      throw new AppException(
        'INVALID_EMPLOYEE_SELECTION',
        'One or more employees could not be found.',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.$transaction(
      adjustments.map((adjustment) =>
        this.prisma.payrollAdjustment.upsert({
          where: {
            month_year_employeeId: {
              month,
              year,
              employeeId: adjustment.employeeId,
            },
          },
          update: {
            bonusEncrypted: this.encryption.encrypt(
              String(adjustment.bonus ?? 0),
            ),
            deductionEncrypted: this.encryption.encrypt(
              String(adjustment.deduction ?? 0),
            ),
            updatedByUserId: userId,
          },
          create: {
            month,
            year,
            employeeId: adjustment.employeeId,
            bonusEncrypted: this.encryption.encrypt(
              String(adjustment.bonus ?? 0),
            ),
            deductionEncrypted: this.encryption.encrypt(
              String(adjustment.deduction ?? 0),
            ),
            createdByUserId: userId,
          },
        }),
      ),
    );

    return this.getAdjustments(month, year, ids);
  }

  /// deductionsEncrypted (the retired flat-rate auto-deduction) is
  /// deliberately excluded from the public shape — historical runs keep the
  /// value in the database, but the API/UI never surfaces it again. The only
  /// deduction going forward is the manually-entered PayrollAdjustment one.
  private toPublicPayslip<
    T extends {
      grossEncrypted: string;
      bonusEncrypted: string | null;
      deductionsEncrypted: string | null;
      adjustmentDeductionEncrypted: string | null;
      netEncrypted: string;
    },
  >(payslip: T) {
    const {
      grossEncrypted,
      bonusEncrypted,
      deductionsEncrypted,
      adjustmentDeductionEncrypted,
      netEncrypted,
      ...rest
    } = payslip;
    void deductionsEncrypted; // retired flat auto-deduction — never surfaced in the API
    return {
      ...rest,
      basePay: Number(this.encryption.decrypt(grossEncrypted)),
      bonus: bonusEncrypted
        ? Number(this.encryption.decrypt(bonusEncrypted))
        : 0,
      deduction: adjustmentDeductionEncrypted
        ? Number(this.encryption.decrypt(adjustmentDeductionEncrypted))
        : 0,
      net: Number(this.encryption.decrypt(netEncrypted)),
    };
  }

  /// Invoked by PayrollProcessor (BullMQ worker) — generates one payslip per
  /// targeted employee (all ACTIVE employees, or just run.selectedEmployeeIds
  /// when run.scope is SELECTED) for this run, factoring in any
  /// PayrollAdjustment staged for that employee/period, then marks the run
  /// COMPLETED/FAILED.
  async processRun(runId: string): Promise<void> {
    const run = await this.prisma.payrollRun.findUniqueOrThrow({
      where: { id: runId },
    });
    await this.prisma.payrollRun.update({
      where: { id: runId },
      data: { status: PayrollRunStatus.PROCESSING },
    });

    try {
      const targetEmployees = await this.prisma.employee.findMany({
        where:
          run.scope === PayrollRunScope.SELECTED
            ? { id: { in: run.selectedEmployeeIds }, status: 'ACTIVE' }
            : { status: 'ACTIVE' },
        select: { id: true },
      });

      const adjustments = await this.prisma.payrollAdjustment.findMany({
        where: {
          month: run.month,
          year: run.year,
          employeeId: { in: targetEmployees.map((e) => e.id) },
        },
      });
      const adjustmentByEmployeeId = new Map(
        adjustments.map((a) => [a.employeeId, a]),
      );

      for (const { id: employeeId } of targetEmployees) {
        const gross =
          await this.employeesService.getDecryptedSalary(employeeId);
        const adjustment = adjustmentByEmployeeId.get(employeeId);
        const bonus = adjustment
          ? Number(this.encryption.decrypt(adjustment.bonusEncrypted))
          : 0;
        const deduction = adjustment
          ? Number(this.encryption.decrypt(adjustment.deductionEncrypted))
          : 0;
        // No automatic deduction is computed — Net Pay is Base Pay + Bonus -
        // Deduction, where Deduction is only ever the manually-staged
        // PayrollAdjustment value above.
        const net = Math.round((gross + bonus - deduction) * 100) / 100;

        await this.prisma.payslipItem.upsert({
          where: {
            payrollRunId_employeeId: { payrollRunId: runId, employeeId },
          },
          update: {
            grossEncrypted: this.encryption.encrypt(String(gross)),
            bonusEncrypted: this.encryption.encrypt(String(bonus)),
            adjustmentDeductionEncrypted: this.encryption.encrypt(
              String(deduction),
            ),
            netEncrypted: this.encryption.encrypt(String(net)),
          },
          create: {
            payrollRunId: runId,
            employeeId,
            grossEncrypted: this.encryption.encrypt(String(gross)),
            bonusEncrypted: this.encryption.encrypt(String(bonus)),
            adjustmentDeductionEncrypted: this.encryption.encrypt(
              String(deduction),
            ),
            netEncrypted: this.encryption.encrypt(String(net)),
          },
        });
      }

      await this.prisma.payrollRun.update({
        where: { id: runId },
        data: { status: PayrollRunStatus.COMPLETED, completedAt: new Date() },
      });
      this.eventsGateway.emitToUser(
        run.triggeredByUserId,
        'payroll:completed',
        {
          runId,
          month: run.month,
          year: run.year,
          employeeCount: targetEmployees.length,
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Payroll run ${runId} failed: ${message}`);
      await this.prisma.payrollRun.update({
        where: { id: runId },
        data: { status: PayrollRunStatus.FAILED, errorMessage: message },
      });
      this.eventsGateway.emitToUser(run.triggeredByUserId, 'payroll:failed', {
        runId,
        month: run.month,
        year: run.year,
        message,
      });
      throw error;
    }
  }
}
