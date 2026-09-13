import { HttpStatus, Injectable } from '@nestjs/common';
import { Branch, Department } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AppException } from '../common/filters/app-exception';
import {
  PaginationQueryDto,
  buildPaginationMeta,
  paginationSkipTake,
} from '../common/pagination/pagination.dto';
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

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------------------------------------------------------------------
  // Company profile (singleton)
  // ---------------------------------------------------------------------

  async getCompanyProfile() {
    const existing = await this.prisma.companyProfile.findFirst();
    if (existing) return existing;
    return this.prisma.companyProfile.create({ data: { name: 'My Company' } });
  }

  async updateCompanyProfile(dto: UpdateCompanyProfileDto) {
    const profile = await this.getCompanyProfile();
    return this.prisma.companyProfile.update({
      where: { id: profile.id },
      data: dto,
    });
  }

  // ---------------------------------------------------------------------
  // Branches
  // ---------------------------------------------------------------------

  async listBranches(query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.branch.findMany({ skip, take, orderBy: { name: 'asc' } }),
      this.prisma.branch.count(),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getBranch(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch)
      throw new AppException(
        'BRANCH_NOT_FOUND',
        'Branch not found.',
        HttpStatus.NOT_FOUND,
      );
    return branch;
  }

  createBranch(dto: CreateBranchDto) {
    return this.prisma.branch.create({ data: dto });
  }

  async updateBranch(id: string, dto: UpdateBranchDto) {
    await this.getBranch(id);
    return this.prisma.branch.update({ where: { id }, data: dto });
  }

  async deleteBranch(id: string) {
    await this.getBranch(id);
    await this.prisma.branch.delete({ where: { id } });
  }

  // ---------------------------------------------------------------------
  // Departments (with hierarchy)
  // ---------------------------------------------------------------------

  async listDepartments(query: PaginationQueryDto, branchId?: string) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where = branchId ? { branchId } : undefined;
    const [items, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take,
        orderBy: { name: 'asc' },
        include: { branch: true, parent: true },
      }),
      this.prisma.department.count({ where }),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getDepartment(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: { branch: true, parent: true, children: true },
    });
    if (!department)
      throw new AppException(
        'DEPARTMENT_NOT_FOUND',
        'Department not found.',
        HttpStatus.NOT_FOUND,
      );
    return department;
  }

  /// Flat list reshaped into a parent -> children tree, for the org chart
  /// view ("departments (with hierarchy)").
  async getDepartmentTree(): Promise<DepartmentTreeNode[]> {
    const all = await this.prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { branch: true },
    });
    const byId = new Map<string, DepartmentTreeNode>(
      all.map((dept) => [dept.id, { ...dept, children: [] }]),
    );
    const roots: DepartmentTreeNode[] = [];

    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) {
        byId.get(node.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }

  async createDepartment(dto: CreateDepartmentDto) {
    if (dto.parentId) {
      await this.assertNotCircular(dto.parentId);
    }
    return this.prisma.department.create({ data: dto });
  }

  async updateDepartment(id: string, dto: UpdateDepartmentDto) {
    await this.getDepartment(id);
    if (dto.parentId) {
      await this.assertNotCircular(dto.parentId, id);
    }
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async deleteDepartment(id: string) {
    await this.getDepartment(id);
    await this.prisma.department.delete({ where: { id } });
  }

  /// Walks up the candidate parent's own ancestor chain to make sure `id`
  /// (the department being saved) never appears in it — otherwise the
  /// hierarchy would contain a loop.
  private async assertNotCircular(
    candidateParentId: string,
    id?: string,
  ): Promise<void> {
    if (id && candidateParentId === id) {
      throw new AppException(
        'CIRCULAR_DEPARTMENT_HIERARCHY',
        'A department cannot be its own parent.',
        HttpStatus.BAD_REQUEST,
      );
    }

    let currentId: string | null = candidateParentId;
    const visited = new Set<string>();
    while (currentId) {
      if (id && currentId === id) {
        throw new AppException(
          'CIRCULAR_DEPARTMENT_HIERARCHY',
          'This would create a circular department hierarchy.',
          HttpStatus.BAD_REQUEST,
        );
      }
      if (visited.has(currentId)) break;
      visited.add(currentId);
      const parent: { parentId: string | null } | null =
        await this.prisma.department.findUnique({
          where: { id: currentId },
          select: { parentId: true },
        });
      currentId = parent?.parentId ?? null;
    }
  }

  // ---------------------------------------------------------------------
  // Company holidays
  // ---------------------------------------------------------------------

  async listHolidays(query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const [items, total] = await Promise.all([
      this.prisma.companyHoliday.findMany({
        skip,
        take,
        orderBy: { date: 'asc' },
      }),
      this.prisma.companyHoliday.count(),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async getHoliday(id: string) {
    const holiday = await this.prisma.companyHoliday.findUnique({
      where: { id },
    });
    if (!holiday)
      throw new AppException(
        'HOLIDAY_NOT_FOUND',
        'Holiday not found.',
        HttpStatus.NOT_FOUND,
      );
    return holiday;
  }

  createHoliday(dto: CreateHolidayDto) {
    return this.prisma.companyHoliday.create({
      data: { ...dto, date: new Date(dto.date) },
    });
  }

  async updateHoliday(id: string, dto: UpdateHolidayDto) {
    await this.getHoliday(id);
    return this.prisma.companyHoliday.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async deleteHoliday(id: string) {
    await this.getHoliday(id);
    await this.prisma.companyHoliday.delete({ where: { id } });
  }

  /// Exported for CalendarEventsService (Module 15) — merges company
  /// holidays into the calendar view read-only, without duplicating them
  /// into a calendar-owned table. Expands recurringAnnually holidays across
  /// every year the range spans, since their stored `date` only carries one
  /// reference year.
  async listHolidaysInRange(dateFrom: Date, dateTo: Date) {
    const holidays = await this.prisma.companyHoliday.findMany();
    const occurrences: {
      id: string;
      name: string;
      description: string | null;
      date: Date;
    }[] = [];

    for (const holiday of holidays) {
      if (!holiday.recurringAnnually) {
        if (holiday.date >= dateFrom && holiday.date <= dateTo) {
          occurrences.push(holiday);
        }
        continue;
      }
      for (
        let year = dateFrom.getUTCFullYear();
        year <= dateTo.getUTCFullYear();
        year++
      ) {
        const occurrence = new Date(
          Date.UTC(year, holiday.date.getUTCMonth(), holiday.date.getUTCDate()),
        );
        if (occurrence >= dateFrom && occurrence <= dateTo) {
          occurrences.push({ ...holiday, date: occurrence });
        }
      }
    }
    return occurrences;
  }
}
