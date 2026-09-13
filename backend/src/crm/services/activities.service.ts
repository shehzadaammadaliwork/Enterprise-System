import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { ListActivitiesQueryDto } from '../dto/list-activities-query.dto';

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async listActivities(query: ListActivitiesQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = { customerId: query.customerId };
    const [items, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { occurredAt: 'desc' },
      }),
      this.prisma.activity.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async createActivity(dto: CreateActivityDto, loggedByUserId: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id: dto.customerId },
      select: { id: true },
    });
    if (!customer)
      throw new AppException(
        'CUSTOMER_NOT_FOUND',
        'Customer not found.',
        HttpStatus.NOT_FOUND,
      );

    return this.prisma.activity.create({
      data: { ...dto, occurredAt: new Date(dto.occurredAt), loggedByUserId },
    });
  }
}
