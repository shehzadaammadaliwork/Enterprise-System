import { HttpStatus, Injectable } from '@nestjs/common';
import { Employee, EmploymentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FieldEncryptionService } from '../../common/security/encryption.service';
import { AppException } from '../../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';

const EMPLOYEE_INCLUDE = {
  department: true,
  // `select` (not `include`) on this nested Employee — otherwise every
  // scalar column comes along for the ride, including the manager's own
  // salaryEncrypted ciphertext.
  reportingManager: {
    select: {
      id: true,
      designation: true,
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} as const;

export type EmployeeWithSalary = Employee & { salary?: number };

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: FieldEncryptionService,
  ) {}

  /// Every response crossing the API boundary uses the decrypted `salary`
  /// number, never the raw `salaryEncrypted` column — and only when the
  /// caller actually holds `payroll:VIEW` (or this is their own record via
  /// the /me self-service path). `employees:VIEW` alone only grants the
  /// general directory, not compensation (Module 7 hardening pass).
  private toPublicShape<T extends { salaryEncrypted: string }>(
    employee: T,
    includeSalary: boolean,
  ): Omit<T, 'salaryEncrypted'> & { salary?: number } {
    const { salaryEncrypted, ...rest } = employee;
    return {
      ...rest,
      ...(includeSalary
        ? { salary: Number(this.encryption.decrypt(salaryEncrypted)) }
        : {}),
    };
  }

  async createEmployee(dto: CreateEmployeeDto, includeSalary: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user)
      throw new AppException(
        'USER_NOT_FOUND',
        'No user with this id exists.',
        HttpStatus.NOT_FOUND,
      );

    // The bootstrap System Admin account (User.isSystemAccount) is never a
    // real staff member and must never be linkable to an Employee profile —
    // enforced here regardless of caller (the "Add employee" picker already
    // excludes it, but this is the actual guard). Any other user holding
    // the Admin role through normal RBAC assignment is unaffected.
    if (user.isSystemAccount) {
      throw new AppException(
        'SYSTEM_ACCOUNT_NOT_LINKABLE',
        'The system administrator account cannot be linked to an employee profile.',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingProfile = await this.prisma.employee.findUnique({
      where: { userId: dto.userId },
    });
    if (existingProfile) {
      throw new AppException(
        'EMPLOYEE_PROFILE_EXISTS',
        'This user already has an employee profile.',
        HttpStatus.CONFLICT,
      );
    }

    // roleIds is assigned separately (RbacService.setUserRoles, called from
    // the controller — see EmployeesController.createEmployee) since RBAC
    // role assignment lives on User, not Employee; not a Prisma Employee
    // field.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { salary, roleIds, ...rest } = dto;
    const employee = await this.prisma.employee.create({
      data: {
        ...rest,
        joiningDate: new Date(dto.joiningDate),
        salaryEncrypted: this.encryption.encrypt(String(salary)),
      },
      include: EMPLOYEE_INCLUDE,
    });
    return this.toPublicShape(employee, includeSalary);
  }

  /// Read-only support for the Employee-onboarding flow (Users page + the
  /// "Add employee" user picker) — surfaces every registered User account
  /// and whether it already has a linked Employee profile, so Admin/HR
  /// never has to query the database directly to find a userId. Deliberately
  /// `select`-scoped (never `include`) so passwordHash/twoFactorSecret can
  /// never leak into this response.
  async listUsers(query: ListUsersQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = {
      ...(query.search
        ? {
            OR: [
              {
                email: { contains: query.search, mode: 'insensitive' as const },
              },
              {
                firstName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
              {
                lastName: {
                  contains: query.search,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
      // The bootstrap System Admin account can never be onboarded (see
      // createEmployee's isSystemAccount guard), so it's excluded from the
      // "needs onboarding" pool the picker and this filter both use —
      // surfacing it there would just be a dead end for Admin/HR. It still
      // appears under the unfiltered/"Onboarded" views since it's a real
      // registered account, just never an onboarding candidate.
      ...(query.needsOnboarding === 'true'
        ? { employee: null, isSystemAccount: false }
        : {}),
      ...(query.needsOnboarding === 'false'
        ? { employee: { isNot: null } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          employee: { select: { id: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map(({ employee, ...user }) => ({
        ...user,
        hasEmployeeProfile: !!employee,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listEmployees(
    query: PaginationQueryDto,
    departmentId: string | undefined,
    includeSalary: boolean,
    status?: EmploymentStatus,
  ) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = {
      ...(departmentId && { departmentId }),
      ...(status && { status }),
    };
    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: EMPLOYEE_INCLUDE,
      }),
      this.prisma.employee.count({ where }),
    ]);
    return {
      items: items.map((employee) =>
        this.toPublicShape(employee, includeSalary),
      ),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getEmployee(id: string, includeSalary: boolean) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee)
      throw new AppException(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found.',
        HttpStatus.NOT_FOUND,
      );
    return this.toPublicShape(employee, includeSalary);
  }

  /// Resolves the Employee row backing the currently-authenticated user —
  /// used by every "me" endpoint (attendance, leave, payslips, reviews).
  /// Always includes salary: this is the caller's own record.
  async getEmployeeByUserId(userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      include: EMPLOYEE_INCLUDE,
    });
    if (!employee) {
      throw new AppException(
        'NO_EMPLOYEE_PROFILE',
        'Your account has no employee profile yet.',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.toPublicShape(employee, true);
  }

  /// Exported for DashboardService (Personal widgets fix) — a lightweight
  /// existence+id lookup, unlike getEmployeeByUserId (which throws if
  /// missing and always decrypts salary, appropriate for actual
  /// self-service payloads but wasteful for something that only needs to
  /// know "does this user have an Employee profile, and if so what's its
  /// id" — e.g. the bootstrap Admin has none, which is expected, not an
  /// error).
  async findEmployeeIdByUserId(userId: string): Promise<string | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { userId },
      select: { id: true },
    });
    return employee?.id ?? null;
  }

  /// Internal helper (no encryption/decryption, no NotFound mapping) for
  /// other employees-module services that just need to confirm the id
  /// exists before writing a child record (attendance, leave, etc).
  async requireEmployeeExists(id: string): Promise<void> {
    const exists = await this.prisma.employee.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!exists)
      throw new AppException(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found.',
        HttpStatus.NOT_FOUND,
      );
  }

  async updateEmployee(
    id: string,
    dto: UpdateEmployeeDto,
    includeSalary: boolean,
  ) {
    await this.requireEmployeeExists(id);
    const { salary, joiningDate, ...rest } = dto;
    const employee = await this.prisma.employee.update({
      where: { id },
      data: {
        ...rest,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        salaryEncrypted:
          salary !== undefined
            ? this.encryption.encrypt(String(salary))
            : undefined,
      },
      include: EMPLOYEE_INCLUDE,
    });
    return this.toPublicShape(employee, includeSalary);
  }

  /// A hard delete would cascade-erase attendance/leave/payroll/review
  /// history — HR data that must survive an offboarding. "Delete" here
  /// means marking the employee TERMINATED, not erasing their record.
  async deactivateEmployee(id: string, includeSalary: boolean) {
    await this.requireEmployeeExists(id);
    const employee = await this.prisma.employee.update({
      where: { id },
      data: { status: 'TERMINATED' },
      include: EMPLOYEE_INCLUDE,
    });
    return this.toPublicShape(employee, includeSalary);
  }

  /// Raw decrypted salary for a single employee — used by the payroll
  /// processor, which needs the number but not the full public shape.
  async getDecryptedSalary(id: string): Promise<number> {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: { salaryEncrypted: true },
    });
    if (!employee)
      throw new AppException(
        'EMPLOYEE_NOT_FOUND',
        'Employee not found.',
        HttpStatus.NOT_FOUND,
      );
    return Number(this.encryption.decrypt(employee.salaryEncrypted));
  }

  /// Exported for DashboardService (Module 16) — aggregates across
  /// Employee/AttendanceRecord/LeaveRequest, all in this module's own
  /// schema section, so it stays a plain internal query rather than a
  /// cross-module call.
  async getHrSummary() {
    const todayUtc = new Date(
      Date.UTC(
        new Date().getUTCFullYear(),
        new Date().getUTCMonth(),
        new Date().getUTCDate(),
      ),
    );
    const [headcount, presentToday, pendingLeaveRequests] = await Promise.all([
      this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
      this.prisma.attendanceRecord.count({
        where: { date: todayUtc, checkInAt: { not: null } },
      }),
      this.prisma.leaveRequest.count({ where: { status: 'PENDING' } }),
    ]);
    return { headcount, presentToday, pendingLeaveRequests };
  }

  /// Exported for ReportsService (Module 17) — HR report trends over
  /// [dateFrom, dateTo]: daily check-in counts (attendance trend) and a
  /// leave-type/status breakdown for requests overlapping the range (same
  /// overlap test as LeaveService.listApprovedInRange, not restricted to
  /// APPROVED only, since a trend report should also surface pending/
  /// rejected volume). Headcount itself is a current snapshot, same as
  /// getHrSummary — there's no historical headcount tracking in this schema.
  async getHrReport(dateFrom: Date, dateTo: Date) {
    const [headcount, attendanceByDate, leaveByTypeAndStatus] =
      await Promise.all([
        this.prisma.employee.count({ where: { status: 'ACTIVE' } }),
        this.prisma.attendanceRecord.groupBy({
          by: ['date'],
          where: {
            date: { gte: dateFrom, lte: dateTo },
            checkInAt: { not: null },
          },
          _count: { _all: true },
          orderBy: { date: 'asc' },
        }),
        this.prisma.leaveRequest.groupBy({
          by: ['leaveType', 'status'],
          where: { startDate: { lte: dateTo }, endDate: { gte: dateFrom } },
          _count: { _all: true },
        }),
      ]);

    const dailyAttendance = attendanceByDate.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      present: row._count._all,
    }));

    const leaveByTypeMap = new Map<
      string,
      { leaveType: string; pending: number; approved: number; rejected: number }
    >();
    for (const row of leaveByTypeAndStatus) {
      const entry = leaveByTypeMap.get(row.leaveType) ?? {
        leaveType: row.leaveType,
        pending: 0,
        approved: 0,
        rejected: 0,
      };
      if (row.status === 'PENDING') entry.pending += row._count._all;
      else if (row.status === 'APPROVED') entry.approved += row._count._all;
      else if (row.status === 'REJECTED') entry.rejected += row._count._all;
      leaveByTypeMap.set(row.leaveType, entry);
    }
    const leaveByType = [...leaveByTypeMap.values()];
    const totalLeaveRequests = leaveByType.reduce(
      (sum, row) => sum + row.pending + row.approved + row.rejected,
      0,
    );

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      headcount,
      totalAttendanceDays: dailyAttendance.reduce(
        (sum, d) => sum + d.present,
        0,
      ),
      dailyAttendance,
      totalLeaveRequests,
      leaveByType,
    };
  }

  /// Exported for ReportsService (Module 17) — resolves a batch of plain
  /// User ids (e.g. Deal.assignedToUserId) to a display name via each
  /// user's Employee profile. Same known limitation as the Documents/Assets
  /// "specific user" pickers: a User with no Employee profile (e.g. the
  /// bootstrap Admin) has nothing to resolve and is simply absent from the
  /// returned map — callers fall back to something else (e.g. "Unassigned").
  async resolveUserDisplayNames(
    userIds: string[],
  ): Promise<Record<string, string>> {
    if (userIds.length === 0) return {};
    const employees = await this.prisma.employee.findMany({
      where: { userId: { in: userIds } },
      select: {
        userId: true,
        user: { select: { firstName: true, lastName: true } },
      },
    });
    return Object.fromEntries(
      employees.map((e) => [
        e.userId,
        `${e.user.firstName} ${e.user.lastName}`,
      ]),
    );
  }
}
