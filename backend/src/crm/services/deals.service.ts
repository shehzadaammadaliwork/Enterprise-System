import { HttpStatus, Injectable } from '@nestjs/common';
import { DealStage, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateDealDto } from '../dto/create-deal.dto';
import { UpdateDealDto } from '../dto/update-deal.dto';
import { ListDealsQueryDto } from '../dto/list-deals-query.dto';

const DEAL_INCLUDE = {
  customer: { select: { id: true, companyName: true, contactName: true } },
} as const;

/// The pipeline a deal walks through before WON — a deal may only advance
/// one stage at a time, or drop to LOST from any non-terminal stage (no
/// skipping stages, e.g. NEW straight to PROPOSAL, and no leaving a
/// terminal stage once WON or LOST).
const DEAL_SEQUENCE: DealStage[] = [
  DealStage.NEW,
  DealStage.QUALIFIED,
  DealStage.PROPOSAL,
  DealStage.NEGOTIATION,
  DealStage.WON,
];

function isValidDealStageTransition(from: DealStage, to: DealStage): boolean {
  if (from === to) return true;
  if (from === DealStage.WON || from === DealStage.LOST) return false;
  if (to === DealStage.LOST) return true;
  const fromIndex = DEAL_SEQUENCE.indexOf(from);
  const toIndex = DEAL_SEQUENCE.indexOf(to);
  return fromIndex !== -1 && toIndex === fromIndex + 1;
}

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  /// Deal.value is a Prisma Decimal (decimal.js) — converted to a plain
  /// JS number here so every API response uses a normal number, never
  /// Prisma's Decimal/string serialization.
  private toPublicShape<T extends { value: Prisma.Decimal | null }>(deal: T) {
    return { ...deal, value: deal.value === null ? null : Number(deal.value) };
  }

  async listDeals(query: ListDealsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.DealWhereInput = {
      ...(query.customerId && { customerId: query.customerId }),
      ...(query.stage && { stage: query.stage }),
    };
    const [items, total] = await Promise.all([
      this.prisma.deal.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: DEAL_INCLUDE,
      }),
      this.prisma.deal.count({ where }),
    ]);
    return {
      items: items.map((deal) => this.toPublicShape(deal)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async getDeal(id: string) {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
      include: DEAL_INCLUDE,
    });
    if (!deal)
      throw new AppException(
        'DEAL_NOT_FOUND',
        'Deal not found.',
        HttpStatus.NOT_FOUND,
      );
    return this.toPublicShape(deal);
  }

  private async requireCustomerExists(customerId: string): Promise<void> {
    const exists = await this.prisma.customer.findUnique({
      where: { id: customerId },
      select: { id: true },
    });
    if (!exists)
      throw new AppException(
        'CUSTOMER_NOT_FOUND',
        'Customer not found.',
        HttpStatus.NOT_FOUND,
      );
  }

  async createDeal(dto: CreateDealDto) {
    await this.requireCustomerExists(dto.customerId);
    const { expectedCloseDate, ...rest } = dto;
    const deal = await this.prisma.deal.create({
      data: {
        ...rest,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : undefined,
      },
      include: DEAL_INCLUDE,
    });
    return this.toPublicShape(deal);
  }

  async updateDeal(id: string, dto: UpdateDealDto) {
    const existing = await this.getDeal(id);
    if (dto.stage && !isValidDealStageTransition(existing.stage, dto.stage)) {
      throw new AppException(
        'DEAL_INVALID_STAGE_TRANSITION',
        `A deal cannot move from ${existing.stage} to ${dto.stage} — deals must progress one stage at a time (New → Qualified → Proposal → Negotiation → Won), or be marked Lost.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (dto.customerId) await this.requireCustomerExists(dto.customerId);
    const { expectedCloseDate, ...rest } = dto;
    const deal = await this.prisma.deal.update({
      where: { id },
      data: {
        ...rest,
        expectedCloseDate: expectedCloseDate
          ? new Date(expectedCloseDate)
          : undefined,
      },
      include: DEAL_INCLUDE,
    });
    return this.toPublicShape(deal);
  }

  async deleteDeal(id: string): Promise<void> {
    await this.getDeal(id);
    await this.prisma.deal.delete({ where: { id } });
  }

  /// Exported for DashboardService (Module 16) — "pipeline" for the Sales
  /// summary widget: open (non-WON/LOST) deal count and total value.
  async getPipelineSummary() {
    const openDeals = await this.prisma.deal.findMany({
      where: { stage: { notIn: [DealStage.WON, DealStage.LOST] } },
      select: { value: true },
    });
    const openPipelineValue = openDeals.reduce(
      (sum, deal) => sum + Number(deal.value ?? 0),
      0,
    );
    return { openDealCount: openDeals.length, openPipelineValue };
  }

  /// Exported for ReportsService (Module 17) — sales performance for deals
  /// created within [dateFrom, dateTo], optionally scoped to one rep
  /// (assignedToUserId — the only rep-identifying field anywhere in the
  /// Sales pipeline; Order/Quote/Invoice only carry createdByUserId, the
  /// administrative creator, not a sales-owner concept). Rep display names
  /// aren't resolved here — Deal.assignedToUserId is a plain cross-module
  /// User id (same as Lead's), so name resolution is left to the caller,
  /// same precedent as every other plain-id reference in this schema.
  async getPerformanceReport(
    dateFrom: Date,
    dateTo: Date,
    assignedToUserId?: string,
  ) {
    const where: Prisma.DealWhereInput = {
      createdAt: { gte: dateFrom, lte: dateTo },
      ...(assignedToUserId && { assignedToUserId }),
    };
    const grouped = await this.prisma.deal.groupBy({
      by: ['assignedToUserId', 'stage'],
      where,
      _sum: { value: true },
      _count: { _all: true },
    });

    const byRepMap = new Map<
      string,
      {
        assignedToUserId: string | null;
        totalDeals: number;
        wonDeals: number;
        lostDeals: number;
        openDeals: number;
        wonValue: number;
      }
    >();
    for (const row of grouped) {
      const key = row.assignedToUserId ?? '__unassigned__';
      const entry = byRepMap.get(key) ?? {
        assignedToUserId: row.assignedToUserId,
        totalDeals: 0,
        wonDeals: 0,
        lostDeals: 0,
        openDeals: 0,
        wonValue: 0,
      };
      entry.totalDeals += row._count._all;
      if (row.stage === DealStage.WON) {
        entry.wonDeals += row._count._all;
        entry.wonValue += Number(row._sum.value ?? 0);
      } else if (row.stage === DealStage.LOST) {
        entry.lostDeals += row._count._all;
      } else {
        entry.openDeals += row._count._all;
      }
      byRepMap.set(key, entry);
    }

    const byRep = [...byRepMap.values()].map((entry) => ({
      ...entry,
      winRate:
        entry.wonDeals + entry.lostDeals === 0
          ? 0
          : entry.wonDeals / (entry.wonDeals + entry.lostDeals),
    }));

    const totals = byRep.reduce(
      (sum, rep) => ({
        totalDeals: sum.totalDeals + rep.totalDeals,
        wonDeals: sum.wonDeals + rep.wonDeals,
        lostDeals: sum.lostDeals + rep.lostDeals,
        openDeals: sum.openDeals + rep.openDeals,
        wonValue: sum.wonValue + rep.wonValue,
      }),
      { totalDeals: 0, wonDeals: 0, lostDeals: 0, openDeals: 0, wonValue: 0 },
    );

    return {
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      ...totals,
      winRate:
        totals.wonDeals + totals.lostDeals === 0
          ? 0
          : totals.wonDeals / (totals.wonDeals + totals.lostDeals),
      byRep: byRep.sort((a, b) => b.wonValue - a.wonValue),
    };
  }
}
