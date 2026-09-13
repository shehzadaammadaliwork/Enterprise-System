import { PerformanceReviewService } from '../services/performance-review.service';
import { EmployeesService } from '../services/employees.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { CreatePerformanceReviewDto } from '../dto/create-performance-review.dto';
export declare class PerformanceReviewController {
    private readonly performanceReviewService;
    constructor(performanceReviewService: PerformanceReviewService);
    create(employeeId: string, user: AuthenticatedUser, dto: CreatePerformanceReviewDto): Promise<{
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
    list(employeeId: string, query: PaginationQueryDto): Promise<{
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
export declare class MyPerformanceReviewController {
    private readonly performanceReviewService;
    private readonly employeesService;
    constructor(performanceReviewService: PerformanceReviewService, employeesService: EmployeesService);
    getMine(user: AuthenticatedUser, query: PaginationQueryDto): Promise<{
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
