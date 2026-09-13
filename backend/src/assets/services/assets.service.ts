import { HttpStatus, Injectable } from '@nestjs/common';
import { Asset, AssetStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { EmployeesService } from '../../employees/services/employees.service';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { UpdateAssetDto } from '../dto/update-asset.dto';
import { ChangeAssetStatusDto } from '../dto/change-asset-status.dto';
import { ListAssetsQueryDto } from '../dto/list-assets-query.dto';

/// Valid next statuses per current status. UNDER_REPAIR deliberately can't
/// go straight to ASSIGNED — it must pass back through AVAILABLE first,
/// which is what "excluded from the assign picker" means in practice.
/// RETIRED is terminal (assets are never deleted once retired).
const VALID_TRANSITIONS: Record<AssetStatus, AssetStatus[]> = {
  AVAILABLE: ['ASSIGNED', 'UNDER_REPAIR', 'RETIRED'],
  ASSIGNED: ['AVAILABLE', 'UNDER_REPAIR', 'RETIRED'],
  UNDER_REPAIR: ['AVAILABLE', 'RETIRED'],
  RETIRED: [],
};

export function isValidAssetStatusTransition(
  from: AssetStatus,
  to: AssetStatus,
): boolean {
  if (from === to) return false;
  return VALID_TRANSITIONS[from].includes(to);
}

export interface CreateAssetFromPurchaseInput {
  name: string;
  purchaseCost: number;
  purchaseRequestId: string;
  assignedEmployeeId?: string;
}

@Injectable()
export class AssetsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employeesService: EmployeesService,
  ) {}

  private toPublicShape<T extends { purchaseCost: Prisma.Decimal | null }>(
    asset: T,
  ) {
    return {
      ...asset,
      purchaseCost:
        asset.purchaseCost === null ? null : Number(asset.purchaseCost),
    };
  }

  async listAssets(query: ListAssetsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.AssetWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { serialNumber: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };
    const [items, total] = await Promise.all([
      this.prisma.asset.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.asset.count({ where }),
    ]);
    return {
      items: items.map((asset) => this.toPublicShape(asset)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async getAssetOrThrow(id: string): Promise<Asset> {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset)
      throw new AppException(
        'ASSET_NOT_FOUND',
        'Asset not found.',
        HttpStatus.NOT_FOUND,
      );
    return asset;
  }

  async getAsset(id: string) {
    return this.toPublicShape(await this.getAssetOrThrow(id));
  }

  async createAsset(dto: CreateAssetDto) {
    const asset = await this.prisma.asset.create({
      data: {
        name: dto.name,
        category: dto.category,
        serialNumber: dto.serialNumber,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchaseCost: dto.purchaseCost,
        notes: dto.notes,
      },
    });
    return this.toPublicShape(asset);
  }

  async updateAsset(id: string, dto: UpdateAssetDto) {
    await this.getAssetOrThrow(id);
    const asset = await this.prisma.asset.update({
      where: { id },
      data: {
        ...dto,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
      },
    });
    return this.toPublicShape(asset);
  }

  async changeStatus(id: string, dto: ChangeAssetStatusDto) {
    const asset = await this.getAssetOrThrow(id);
    if (!isValidAssetStatusTransition(asset.status, dto.status)) {
      throw new AppException(
        'INVALID_ASSET_STATUS_TRANSITION',
        `Cannot move an asset from ${asset.status} to ${dto.status}.`,
        HttpStatus.BAD_REQUEST,
      );
    }
    let assignedEmployeeId: string | null = null;
    if (dto.status === AssetStatus.ASSIGNED) {
      if (!dto.assignedEmployeeId) {
        throw new AppException(
          'ASSET_ASSIGNMENT_REQUIRES_EMPLOYEE',
          'Assigning an asset requires selecting an employee.',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.employeesService.requireEmployeeExists(dto.assignedEmployeeId);
      assignedEmployeeId = dto.assignedEmployeeId;
    }
    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        status: dto.status,
        assignedEmployeeId,
        retirementReason:
          dto.status === AssetStatus.RETIRED ? dto.retirementReason : null,
      },
    });
    return this.toPublicShape(updated);
  }

  async deleteAsset(id: string): Promise<void> {
    const asset = await this.getAssetOrThrow(id);
    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new AppException(
        'ASSET_NOT_DELETABLE',
        'Only an available asset (never assigned, repaired, or retired) can be deleted — change its status to reflect reality instead.',
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.asset.delete({ where: { id } });
  }

  /// Called by PurchasingModule's PurchaseRequestsService when a Purchase
  /// Request with category EQUIPMENT is marked purchased. The Purchase
  /// Request's own category enum is coarser than AssetCategory, so the
  /// specific category defaults to OTHER_EQUIPMENT here — Admin/HR
  /// corrects it afterward on the asset if it's actually a Laptop/Monitor/
  /// Phone (documented scope call, see PROJECT_STATUS.md).
  async createFromPurchase(input: CreateAssetFromPurchaseInput) {
    const asset = await this.prisma.asset.create({
      data: {
        name: input.name,
        category: 'OTHER_EQUIPMENT',
        purchaseDate: new Date(),
        purchaseCost: input.purchaseCost,
        purchaseRequestId: input.purchaseRequestId,
        status: input.assignedEmployeeId
          ? AssetStatus.ASSIGNED
          : AssetStatus.AVAILABLE,
        assignedEmployeeId: input.assignedEmployeeId,
      },
    });
    return this.toPublicShape(asset);
  }
}
