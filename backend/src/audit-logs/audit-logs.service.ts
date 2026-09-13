import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../common/pagination/pagination.dto';
import { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto';

@Injectable()
export class AuditLogsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAuditLogs(query: ListAuditLogsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.AuditLogWhereInput = {
      ...(query.userEmail && {
        userEmail: { contains: query.userEmail, mode: 'insensitive' },
      }),
      ...(query.module && { module: query.module }),
      ...(query.action && { action: query.action }),
      ...(query.entityType && {
        entityType: { contains: query.entityType, mode: 'insensitive' },
      }),
      ...((query.dateFrom || query.dateTo) && {
        createdAt: {
          ...(query.dateFrom && { gte: new Date(query.dateFrom) }),
          ...(query.dateTo && { lte: new Date(query.dateTo) }),
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async listDistinctModules(): Promise<string[]> {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['module'],
      select: { module: true },
      orderBy: { module: 'asc' },
    });
    return rows.map((row) => row.module);
  }

  async getAuditLog(id: string) {
    const log = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!log)
      throw new AppException(
        'AUDIT_LOG_NOT_FOUND',
        'Audit log entry not found.',
        HttpStatus.NOT_FOUND,
      );
    return log;
  }
}
