import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { EmployeesService } from './employees.service';
import { CreatePerformanceReviewDto } from '../dto/create-performance-review.dto';

@Injectable()
export class PerformanceReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  async createReview(
    employeeId: string,
    reviewerUserId: string,
    dto: CreatePerformanceReviewDto,
  ) {
    await this.employeesService.requireEmployeeExists(employeeId);
    return this.prisma.performanceReview.create({
      data: {
        employeeId,
        reviewerUserId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        rating: dto.rating,
        notes: dto.notes,
      },
    });
  }

  async listForEmployee(employeeId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.performanceReview.findMany({
        where: { employeeId },
        skip,
        take,
        orderBy: { periodStart: 'desc' },
      }),
      this.prisma.performanceReview.count({ where: { employeeId } }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }
}
