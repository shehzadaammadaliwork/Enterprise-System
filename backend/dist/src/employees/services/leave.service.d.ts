import { LeaveStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { RbacService } from '../../rbac/rbac.service';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
export declare class LeaveService {
    private readonly prisma;
    private readonly employeesService;
    private readonly notificationsService;
    private readonly rbacService;
    constructor(prisma: PrismaService, employeesService: EmployeesService, notificationsService: NotificationsService, rbacService: RbacService);
    createRequest(employeeId: string, dto: CreateLeaveRequestDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
    }>;
    listForEmployee(employeeId: string, query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.LeaveStatus;
            employeeId: string;
            leaveType: import("@prisma/client").$Enums.LeaveType;
            startDate: Date;
            endDate: Date;
            reason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    listAll(query: PaginationQueryDto, status?: LeaveStatus, employeeId?: string): Promise<{
        items: ({
            employee: {
                id: string;
                user: {
                    email: string;
                    firstName: string;
                    lastName: string;
                };
                designation: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import("@prisma/client").$Enums.LeaveStatus;
            employeeId: string;
            leaveType: import("@prisma/client").$Enums.LeaveType;
            startDate: Date;
            endDate: Date;
            reason: string | null;
            decidedByUserId: string | null;
            decidedAt: Date | null;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getRequest(id: string): Promise<{
        employee: {
            id: string;
            user: {
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
    }>;
    decide(id: string, decidedByUserId: string, approve: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
    }>;
    getMyLeaveSummary(employeeId: string): Promise<{
        pendingLeaveRequests: number;
        approvedDaysThisYear: number;
    }>;
    listApprovedInRange(dateFrom: Date, dateTo: Date, departmentId?: string): Promise<({
        employee: {
            user: {
                firstName: string;
                lastName: string;
            };
            userId: string;
            departmentId: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import("@prisma/client").$Enums.LeaveStatus;
        employeeId: string;
        leaveType: import("@prisma/client").$Enums.LeaveType;
        startDate: Date;
        endDate: Date;
        reason: string | null;
        decidedByUserId: string | null;
        decidedAt: Date | null;
    })[]>;
}
