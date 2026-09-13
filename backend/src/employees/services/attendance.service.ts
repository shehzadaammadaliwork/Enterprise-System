import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';

function startOfUtcDay(date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async checkIn(employeeId: string) {
    await this.employeesService.requireEmployeeExists(employeeId);
    const date = startOfUtcDay();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });

    if (existing?.checkInAt) {
      throw new AppException(
        'ALREADY_CHECKED_IN',
        'Already checked in today.',
        HttpStatus.CONFLICT,
      );
    }
    if (existing) {
      return this.prisma.attendanceRecord.update({
        where: { id: existing.id },
        data: { checkInAt: new Date() },
      });
    }
    return this.prisma.attendanceRecord.create({
      data: { employeeId, date, checkInAt: new Date() },
    });
  }

  async checkOut(employeeId: string) {
    await this.employeesService.requireEmployeeExists(employeeId);
    const date = startOfUtcDay();
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });

    if (!existing?.checkInAt) {
      throw new AppException(
        'NOT_CHECKED_IN',
        'You must check in before checking out.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (existing.checkOutAt) {
      throw new AppException(
        'ALREADY_CHECKED_OUT',
        'Already checked out today.',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.attendanceRecord.update({
      where: { id: existing.id },
      data: { checkOutAt: new Date() },
    });
  }

  /// Exported for DashboardService (Personal widgets fix) — "My Attendance
  /// Today", shown to every employee regardless of RBAC permissions (this
  /// is their own self-service data, same as everything else under /me).
  async getTodayRecord(employeeId: string) {
    const date = startOfUtcDay();
    return this.prisma.attendanceRecord.findUnique({
      where: { employeeId_date: { employeeId, date } },
    });
  }

  async listHistory(employeeId: string, query: PaginationQueryDto) {
    await this.employeesService.requireEmployeeExists(employeeId);
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: { employeeId },
        skip,
        take,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where: { employeeId } }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
