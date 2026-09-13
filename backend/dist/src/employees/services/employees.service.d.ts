import { Employee, EmploymentStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FieldEncryptionService } from '../../common/security/encryption.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
export type EmployeeWithSalary = Employee & {
    salary?: number;
};
export declare class EmployeesService {
    private readonly prisma;
    private readonly encryption;
    constructor(prisma: PrismaService, encryption: FieldEncryptionService);
    private toPublicShape;
    createEmployee(dto: CreateEmployeeDto, includeSalary: boolean): Promise<Omit<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        reportingManager: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.EmploymentStatus;
        departmentId: string | null;
        designation: string;
        joiningDate: Date;
        reportingManagerId: string | null;
        salaryEncrypted: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelation: string | null;
    }, "salaryEncrypted"> & {
        salary?: number;
    }>;
    listUsers(query: ListUsersQueryDto): Promise<{
        items: {
            hasEmployeeProfile: boolean;
            id: string;
            createdAt: Date;
            email: string;
            firstName: string;
            lastName: string;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    listEmployees(query: PaginationQueryDto, departmentId: string | undefined, includeSalary: boolean, status?: EmploymentStatus): Promise<{
        items: (Omit<{
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            department: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                code: string | null;
                branchId: string | null;
                parentId: string | null;
                managerUserId: string | null;
            } | null;
            reportingManager: {
                id: string;
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
                designation: string;
            } | null;
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import("@prisma/client").$Enums.EmploymentStatus;
            departmentId: string | null;
            designation: string;
            joiningDate: Date;
            reportingManagerId: string | null;
            salaryEncrypted: string;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postalCode: string | null;
            emergencyContactName: string | null;
            emergencyContactPhone: string | null;
            emergencyContactRelation: string | null;
        }, "salaryEncrypted"> & {
            salary?: number;
        })[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    getEmployee(id: string, includeSalary: boolean): Promise<Omit<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        reportingManager: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.EmploymentStatus;
        departmentId: string | null;
        designation: string;
        joiningDate: Date;
        reportingManagerId: string | null;
        salaryEncrypted: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelation: string | null;
    }, "salaryEncrypted"> & {
        salary?: number;
    }>;
    getEmployeeByUserId(userId: string): Promise<Omit<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        reportingManager: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.EmploymentStatus;
        departmentId: string | null;
        designation: string;
        joiningDate: Date;
        reportingManagerId: string | null;
        salaryEncrypted: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelation: string | null;
    }, "salaryEncrypted"> & {
        salary?: number;
    }>;
    findEmployeeIdByUserId(userId: string): Promise<string | null>;
    requireEmployeeExists(id: string): Promise<void>;
    updateEmployee(id: string, dto: UpdateEmployeeDto, includeSalary: boolean): Promise<Omit<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        reportingManager: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.EmploymentStatus;
        departmentId: string | null;
        designation: string;
        joiningDate: Date;
        reportingManagerId: string | null;
        salaryEncrypted: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelation: string | null;
    }, "salaryEncrypted"> & {
        salary?: number;
    }>;
    deactivateEmployee(id: string, includeSalary: boolean): Promise<Omit<{
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
        department: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        reportingManager: {
            id: string;
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
            designation: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import("@prisma/client").$Enums.EmploymentStatus;
        departmentId: string | null;
        designation: string;
        joiningDate: Date;
        reportingManagerId: string | null;
        salaryEncrypted: string;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        emergencyContactName: string | null;
        emergencyContactPhone: string | null;
        emergencyContactRelation: string | null;
    }, "salaryEncrypted"> & {
        salary?: number;
    }>;
    getDecryptedSalary(id: string): Promise<number>;
    getHrSummary(): Promise<{
        headcount: number;
        presentToday: number;
        pendingLeaveRequests: number;
    }>;
    getHrReport(dateFrom: Date, dateTo: Date): Promise<{
        dateFrom: string;
        dateTo: string;
        headcount: number;
        totalAttendanceDays: number;
        dailyAttendance: {
            date: string;
            present: number;
        }[];
        totalLeaveRequests: number;
        leaveByType: {
            leaveType: string;
            pending: number;
            approved: number;
            rejected: number;
        }[];
    }>;
    resolveUserDisplayNames(userIds: string[]): Promise<Record<string, string>>;
}
