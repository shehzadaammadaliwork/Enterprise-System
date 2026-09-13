import { LeaveService } from '../services/leave.service';
import { EmployeesService } from '../services/employees.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateLeaveRequestDto } from '../dto/create-leave-request.dto';
import { ListLeaveRequestsQueryDto } from '../dto/list-leave-requests-query.dto';
export declare class LeaveController {
    private readonly leaveService;
    private readonly employeesService;
    constructor(leaveService: LeaveService, employeesService: EmployeesService);
    createRequest(user: AuthenticatedUser, dto: CreateLeaveRequestDto): Promise<{
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
    getMyRequests(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
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
    listAll(query: ListLeaveRequestsQueryDto): Promise<{
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
    approve(id: string, user: AuthenticatedUser): Promise<{
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
    reject(id: string, user: AuthenticatedUser): Promise<{
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
}
