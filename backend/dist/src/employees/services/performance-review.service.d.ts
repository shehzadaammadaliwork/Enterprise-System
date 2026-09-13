import { PrismaService } from '../../common/prisma/prisma.service';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { CreatePerformanceReviewDto } from '../dto/create-performance-review.dto';
export declare class PerformanceReviewService {
    private readonly prisma;
    private readonly employeesService;
    constructor(prisma: PrismaService, employeesService: EmployeesService);
    createReview(employeeId: string, reviewerUserId: string, dto: CreatePerformanceReviewDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        employeeId: string;
        periodStart: Date;
        periodEnd: Date;
        rating: number;
        notes: string | null;
        reviewerUserId: string;
    }>;
    listForEmployee(employeeId: string, query: PaginationQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            employeeId: string;
            periodStart: Date;
            periodEnd: Date;
            rating: number;
            notes: string | null;
            reviewerUserId: string;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
}
