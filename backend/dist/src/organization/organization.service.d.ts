import { Branch, Department } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { CreateHolidayDto } from './dto/create-holiday.dto';
import { UpdateHolidayDto } from './dto/update-holiday.dto';
export interface DepartmentTreeNode extends Department {
    branch: Branch | null;
    children: DepartmentTreeNode[];
}
export declare class OrganizationService {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    listDepartments(query: PaginationQueryDto, branchId?: string): Promise<{
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
    getDepartmentTree(): Promise<DepartmentTreeNode[]>;
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
    private assertNotCircular;
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
    getHoliday(id: string): Promise<{
        id: string;
        description: string | null;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        date: Date;
        recurringAnnually: boolean;
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
    listHolidaysInRange(dateFrom: Date, dateTo: Date): Promise<{
        id: string;
        name: string;
        description: string | null;
        date: Date;
    }[]>;
}
