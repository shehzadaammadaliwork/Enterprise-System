import { AttendanceService } from '../services/attendance.service';
import { EmployeesService } from '../services/employees.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly employeesService;
    constructor(attendanceService: AttendanceService, employeesService: EmployeesService);
    checkIn(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
    }>;
    checkOut(user: AuthenticatedUser): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
    }>;
    getMyHistory(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getHistory(employeeId: string, query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            date: Date;
            checkInAt: Date | null;
            checkOutAt: Date | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
}
