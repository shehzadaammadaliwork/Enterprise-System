import { HttpStatus, Injectable } from '@nestjs/common';
import { LeadStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';
import { ListLeadsQueryDto } from '../dto/list-leads-query.dto';

/// The pipeline a lead walks through before CONVERTED, which is reached
/// only via POST /crm/leads/:id/convert (see convertLead below), never
/// through this array/updateLead directly.
const LEAD_SEQUENCE: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
];

/// A lead may only advance one stage at a time through LEAD_SEQUENCE, or
/// drop to LOST from any non-terminal stage — no skipping stages (e.g.
/// NEW straight to QUALIFIED) and no leaving a terminal stage (LOST,
/// or CONVERTED which never reaches this check — see updateLead).
function isValidLeadStatusTransition(
  from: LeadStatus,
  to: LeadStatus,
): boolean {
  if (from === to) return true;
  if (from === LeadStatus.LOST) return false;
  if (to === LeadStatus.LOST) return true;
  const fromIndex = LEAD_SEQUENCE.indexOf(from);
  const toIndex = LEAD_SEQUENCE.indexOf(to);
  return fromIndex !== -1 && toIndex === fromIndex + 1;
}

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async listLeads(query: ListLeadsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.LeadWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.search && {
        OR: [
          { companyName: { contains: query.search, mode: 'insensitive' } },
          { contactName: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.lead.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getLead(id: string) {
    const lead = await this.prisma.lead.findUnique({ where: { id } });
    if (!lead)
      throw new AppException(
        'LEAD_NOT_FOUND',
        'Lead not found.',
        HttpStatus.NOT_FOUND,
      );
    return lead;
  }

  createLead(dto: CreateLeadDto) {
    return this.prisma.lead.create({ data: dto });
  }

  async updateLead(id: string, dto: UpdateLeadDto) {
    const existing = await this.getLead(id);
    if (dto.status === LeadStatus.CONVERTED) {
      throw new AppException(
        'LEAD_STATUS_CONVERTED_NOT_ALLOWED',
        'A lead can only reach CONVERTED status via POST /crm/leads/:id/convert.',
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      dto.status &&
      !isValidLeadStatusTransition(existing.status, dto.status)
    ) {
      throw new AppException(
        'LEAD_INVALID_STATUS_TRANSITION',
        `A lead cannot move from ${existing.status} to ${dto.status} — leads must progress one stage at a time (New → Contacted → Qualified), or be marked Lost.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.prisma.lead.update({ where: { id }, data: dto });
  }

  async deleteLead(id: string): Promise<void> {
    await this.getLead(id);
    await this.prisma.lead.delete({ where: { id } });
  }

  async convertLead(id: string) {
    const lead = await this.getLead(id);
    if (lead.status === LeadStatus.CONVERTED) {
      throw new AppException(
        'LEAD_ALREADY_CONVERTED',
        'This lead has already been converted to a customer.',
        HttpStatus.CONFLICT,
      );
    }
    if (lead.status !== LeadStatus.QUALIFIED) {
      throw new AppException(
        'LEAD_NOT_QUALIFIED',
        'Only a Qualified lead can be converted to a customer — move it through Contacted and Qualified first.',
        HttpStatus.CONFLICT,
      );
    }

    const customer = await this.prisma.customer.create({
      data: {
        companyName: lead.companyName,
        contactName: lead.contactName,
        email: lead.email,
        phone: lead.phone,
      },
    });

    const updatedLead = await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.CONVERTED,
        convertedToCustomerId: customer.id,
      },
    });

    return { lead: updatedLead, customer };
  }
}
