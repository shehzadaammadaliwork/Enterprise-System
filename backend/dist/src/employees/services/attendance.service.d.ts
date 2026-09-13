import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
export declare class AttendanceService {
    private readonly prisma;
    private readonly employeesService;
    constructor(prisma: PrismaService, employeesService: EmployeesService);
    checkIn(employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
    }>;
    checkOut(employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
    }>;
    getTodayRecord(employeeId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        date: Date;
        checkInAt: Date | null;
        checkOutAt: Date | null;
    } | null>;
    listHistory(employeeId: string, query: PaginationQueryDto): Promise<{
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
