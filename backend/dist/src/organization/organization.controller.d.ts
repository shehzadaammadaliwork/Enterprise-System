import { OrganizationService } from './organization.service';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
import { ListDepartmentsQueryDto } from './dto/list-departments-query.dto';
export declare class OrganizationController {
    private readonly organizationService;
    constructor(organizationService: OrganizationService);
    getCompanyProfile(): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fiscalYearStartMonth: number;
        workingHoursStart: string;
        workingHoursEnd: string;
    }>;
    updateCompanyProfile(dto: UpdateCompanyProfileDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        fiscalYearStartMonth: number;
        workingHoursStart: string;
        workingHoursEnd: string;
    }>;
    listBranches(query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postalCode: string | null;
            phone: string | null;
            isHeadquarters: boolean;
        }[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createBranch(dto: CreateBranchDto): import("@prisma/client").Prisma.Prisma__BranchClient<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
        isHeadquarters: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    getBranch(id: string): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
        isHeadquarters: boolean;
    }>;
    updateBranch(id: string, dto: UpdateBranchDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        addressLine1: string | null;
        addressLine2: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        phone: string | null;
        isHeadquarters: boolean;
    }>;
    deleteBranch(id: string): Promise<void>;
    getDepartmentTree(): Promise<import("./organization.service").DepartmentTreeNode[]>;
    listDepartments(query: ListDepartmentsQueryDto): Promise<{
        items: ({
            branch: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                addressLine1: string | null;
                addressLine2: string | null;
                city: string | null;
                state: string | null;
                country: string | null;
                postalCode: string | null;
                phone: string | null;
                isHeadquarters: boolean;
            } | null;
            parent: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                code: string | null;
                branchId: string | null;
                parentId: string | null;
                managerUserId: string | null;
            } | null;
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        })[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createDepartment(dto: CreateDepartmentDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        branchId: string | null;
        parentId: string | null;
        managerUserId: string | null;
    }>;
    getDepartment(id: string): Promise<{
        branch: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            addressLine1: string | null;
            addressLine2: string | null;
            city: string | null;
            state: string | null;
            country: string | null;
            postalCode: string | null;
            phone: string | null;
            isHeadquarters: boolean;
        } | null;
        parent: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        } | null;
        children: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            code: string | null;
            branchId: string | null;
            parentId: string | null;
            managerUserId: string | null;
        }[];
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        branchId: string | null;
        parentId: string | null;
        managerUserId: string | null;
    }>;
    updateDepartment(id: string, dto: UpdateDepartmentDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        code: string | null;
        branchId: string | null;
        parentId: string | null;
        managerUserId: string | null;
    }>;
    deleteDepartment(id: string): Promise<void>;
    listHolidays(query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            description: string | null;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            date: Date;
            recurringAnnually: boolean;
        }[];
        meta: import("../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createHoliday(dto: CreateHolidayDto): import("@prisma/client").Prisma.Prisma__CompanyHolidayClient<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        recurringAnnually: boolean;
    }, never, import("@prisma/client/runtime/library").DefaultArgs, import("@prisma/client").Prisma.PrismaClientOptions>;
    updateHoliday(id: string, dto: UpdateHolidayDto): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        recurringAnnually: boolean;
    }>;
    deleteHoliday(id: string): Promise<void>;
}
