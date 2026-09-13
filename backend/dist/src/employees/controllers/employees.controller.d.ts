import { EmployeesService } from '../services/employees.service';
import { RbacService } from '../../rbac/rbac.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { UpdateEmployeeDto } from '../dto/update-employee.dto';
import { ListEmployeesQueryDto } from '../dto/list-employees-query.dto';
export declare class EmployeesController {
    private readonly employeesService;
    private readonly rbacService;
    constructor(employeesService: EmployeesService, rbacService: RbacService);
    private canViewSalary;
    private canEditSalary;
    getMyProfile(user: AuthenticatedUser): Promise<Omit<{
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
    listEmployees(user: AuthenticatedUser, query: ListEmployeesQueryDto): Promise<{
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
    createEmployee(user: AuthenticatedUser, dto: CreateEmployeeDto): Promise<Omit<{
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
    getEmployee(user: AuthenticatedUser, id: string): Promise<Omit<{
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
    updateEmployee(user: AuthenticatedUser, id: string, dto: UpdateEmployeeDto): Promise<Omit<{
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
    deactivateEmployee(user: AuthenticatedUser, id: string): Promise<Omit<{
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
}
