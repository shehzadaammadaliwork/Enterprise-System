import { HttpStatus, Injectable } from '@nestjs/common';
import { LeaveStatus, NotificationEventType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { RbacService } from '../../rbac/rbac.service';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';

@Injectable()
export class LeaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
    private readonly notificationsService: NotificationsService,
    private readonly rbacService: RbacService,
  ) {}

  async createRequest(employeeId: string, dto: CreateLeaveRequestDto) {
    await this.employeesService.requireEmployeeExists(employeeId);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate < startDate) {
      throw new AppException(
        'INVALID_LEAVE_RANGE',
        'endDate must be on or after startDate.',
        HttpStatus.BAD_REQUEST,
      );
    }
    const request = await this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        reason: dto.reason,
      },
    });

    // Notify everyone who can approve/reject (employees:EDIT), not a
    // specific manager — the same "RBAC gates who can approve, not
    // necessarily reportingManager" reasoning as LeaveRequest.decidedByUserId's
    // own doc comment.
    const approverUserIds = await this.rbacService.getUserIdsWithPermission(
      'employees',
      'EDIT',
    );
    await Promise.all(
      approverUserIds.map((userId) =>
        this.notificationsService.notify(
          userId,
          NotificationEventType.LEAVE_REQUEST_SUBMITTED,
          'New leave request',
          `A ${dto.leaveType.toLowerCase()} leave request is awaiting your review.`,
          { leaveRequestId: request.id },
        ),
      ),
    );

    return request;
  }

  async listForEmployee(employeeId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where: { employeeId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.leaveRequest.count({ where: { employeeId } }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async listAll(
    query: PaginationQueryDto,
    status?: LeaveStatus,
    employeeId?: string,
  ) {
    const where = {
      ...(status ? { status } : {}),
      ...(employeeId ? { employeeId } : {}),
    };
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
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
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getRequest(id: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
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
    });
    if (!request)
      throw new AppException(
        'LEAVE_REQUEST_NOT_FOUND',
        'Leave request not found.',
        HttpStatus.NOT_FOUND,
      );
    return request;
  }

  async decide(id: string, decidedByUserId: string, approve: boolean) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { employee: { select: { userId: true } } },
    });
    if (!request)
      throw new AppException(
        'LEAVE_REQUEST_NOT_FOUND',
        'Leave request not found.',
        HttpStatus.NOT_FOUND,
      );
    if (request.status !== LeaveStatus.PENDING) {
      throw new AppException(
        'LEAVE_REQUEST_ALREADY_DECIDED',
        'This leave request has already been decided.',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.prisma.leaveRequest.update({
      where: { id },
      data: {
        status: approve ? LeaveStatus.APPROVED : LeaveStatus.REJECTED,
        decidedByUserId,
        decidedAt: new Date(),
      },
    });
    await this.notificationsService.notify(
      request.employee.userId,
      NotificationEventType.LEAVE_REQUEST_DECIDED,
      `Leave request ${approve ? 'approved' : 'rejected'}`,
      `Your ${request.leaveType.toLowerCase()} leave request has been ${approve ? 'approved' : 'rejected'}.`,
      { leaveRequestId: id },
    );
    return updated;
  }

  /// Exported for DashboardService (Personal widgets fix) — "My Leave"
  /// widget. There's no leave-entitlement/allocation model anywhere in this
  /// schema (Module 5 never specced one), so this deliberately doesn't
  /// fabricate a true "balance" — pendingCount is real (their own
  /// not-yet-decided requests) and approvedDaysThisYear is a real derived
  /// figure (days actually taken this calendar year), not an invented
  /// entitlement number.
  async getMyLeaveSummary(employeeId: string) {
    const now = new Date();
    const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
    const yearEnd = new Date(
      Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59, 999),
    );

    const [pendingCount, approvedThisYear] = await Promise.all([
      this.prisma.leaveRequest.count({
        where: { employeeId, status: LeaveStatus.PENDING },
      }),
      this.prisma.leaveRequest.findMany({
        where: {
          employeeId,
          status: LeaveStatus.APPROVED,
          startDate: { lte: yearEnd },
          endDate: { gte: yearStart },
        },
        select: { startDate: true, endDate: true },
      }),
    ]);

    const approvedDaysThisYear = approvedThisYear.reduce((sum, request) => {
      const start =
        request.startDate < yearStart ? yearStart : request.startDate;
      const end = request.endDate > yearEnd ? yearEnd : request.endDate;
      const days =
        Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
      return sum + days;
    }, 0);

    return { pendingLeaveRequests: pendingCount, approvedDaysThisYear };
  }

  /// Exported for CalendarEventsService (Module 15) — merges approved leave
  /// into the calendar view read-only, without duplicating it into a
  /// calendar-owned table (same reasoning as
  /// OrganizationService.listHolidaysInRange). Overlap test, not a strict
  /// containment test, since a leave spanning outside [dateFrom, dateTo]
  /// should still show up for the days that do fall in range.
  async listApprovedInRange(
    dateFrom: Date,
    dateTo: Date,
    departmentId?: string,
  ) {
    return this.prisma.leaveRequest.findMany({
      where: {
        status: LeaveStatus.APPROVED,
        startDate: { lte: dateTo },
        endDate: { gte: dateFrom },
        ...(departmentId ? { employee: { departmentId } } : {}),
      },
      include: {
        employee: {
          select: {
            userId: true,
            departmentId: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }
}
