import { HttpStatus, Injectable } from '@nestjs/common';
import {
  Prisma,
  PurchaseRequest,
  PurchaseRequestCategory,
  PurchaseRequestStatus,
  NotificationEventType,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';
import { TransactionsService } from '../../finance/services/transactions.service';
import { EmployeesService } from '../../employees/services/employees.service';
import { AssetsService } from '../../assets/services/assets.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { RbacService } from '../../rbac/rbac.service';
import { CreatePurchaseRequestDto } from '../dto/create-purchase-request.dto';
import { MarkPurchasedDto } from '../dto/mark-purchased.dto';
import { ListPurchaseRequestsQueryDto } from '../dto/list-purchase-requests-query.dto';

/// Category values as they appear on the auto-created Finance expense —
/// "Software & Subscriptions" matches the curated category already offered
/// on the Transactions page, so P&L category grouping stays consistent.
const EXPENSE_CATEGORY_LABEL: Record<PurchaseRequestCategory, string> = {
  EQUIPMENT: 'Equipment',
  SOFTWARE_SUBSCRIPTION: 'Software & Subscriptions',
  OTHER: 'Other',
};

@Injectable()
export class PurchaseRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService,
    private readonly employeesService: EmployeesService,
    private readonly assetsService: AssetsService,
    private readonly notificationsService: NotificationsService,
    private readonly rbacService: RbacService,
  ) {}

  private toPublicShape<
    T extends {
      estimatedCost: Prisma.Decimal;
      actualAmount: Prisma.Decimal | null;
    },
  >(request: T) {
    return {
      ...request,
      estimatedCost: Number(request.estimatedCost),
      actualAmount:
        request.actualAmount === null ? null : Number(request.actualAmount),
    };
  }

  async createRequest(
    requestedByUserId: string,
    dto: CreatePurchaseRequestDto,
  ) {
    const request = await this.prisma.purchaseRequest.create({
      data: { ...dto, requestedByUserId },
    });

    // Same "notify whoever can approve" pattern as LeaveService.createRequest
    // — procurement:EDIT is what actually gates approval, not a fixed manager.
    const approverUserIds = await this.rbacService.getUserIdsWithPermission(
      'procurement',
      'EDIT',
    );
    await Promise.all(
      approverUserIds.map((userId) =>
        this.notificationsService.notify(
          userId,
          NotificationEventType.PURCHASE_REQUEST_SUBMITTED,
          'New purchase request',
          `Purchase request #${request.number} ("${request.description}") is awaiting your review.`,
          { purchaseRequestId: request.id },
        ),
      ),
    );

    return this.toPublicShape(request);
  }

  async listRequests(query: ListPurchaseRequestsQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.PurchaseRequestWhereInput = {
      ...(query.status && { status: query.status }),
      ...(query.category && { category: query.category }),
    };
    const [items, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return {
      items: items.map((r) => this.toPublicShape(r)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  async listMyRequests(requestedByUserId: string, query: PaginationQueryDto) {
    const { skip, take, page, limit } = paginationSkipTake(query);
    const where: Prisma.PurchaseRequestWhereInput = { requestedByUserId };
    const [items, total] = await Promise.all([
      this.prisma.purchaseRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.purchaseRequest.count({ where }),
    ]);
    return {
      items: items.map((r) => this.toPublicShape(r)),
      meta: buildPaginationMeta(page, limit, total),
    };
  }

  private async getRequestOrThrow(id: string): Promise<PurchaseRequest> {
    const request = await this.prisma.purchaseRequest.findUnique({
      where: { id },
    });
    if (!request)
      throw new AppException(
        'PURCHASE_REQUEST_NOT_FOUND',
        'Purchase request not found.',
        HttpStatus.NOT_FOUND,
      );
    return request;
  }

  async getRequest(id: string) {
    return this.toPublicShape(await this.getRequestOrThrow(id));
  }

  /// PENDING -> APPROVED/REJECTED only — same "already decided" 409 shape
  /// as LeaveService.decide()/TransactionsService.decide().
  async decide(id: string, decidedByUserId: string, approve: boolean) {
    const request = await this.getRequestOrThrow(id);
    if (request.status !== PurchaseRequestStatus.PENDING) {
      throw new AppException(
        'PURCHASE_REQUEST_ALREADY_DECIDED',
        'This purchase request has already been decided.',
        HttpStatus.CONFLICT,
      );
    }
    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: approve
          ? PurchaseRequestStatus.APPROVED
          : PurchaseRequestStatus.REJECTED,
        decidedByUserId,
        decidedAt: new Date(),
      },
    });
    await this.notificationsService.notify(
      request.requestedByUserId,
      NotificationEventType.PURCHASE_REQUEST_DECIDED,
      `Purchase request ${approve ? 'approved' : 'rejected'}`,
      `Your purchase request #${request.number} ("${request.description}") has been ${approve ? 'approved' : 'rejected'}.`,
      { purchaseRequestId: id },
    );
    return this.toPublicShape(updated);
  }

  /// The only place a Finance Expense or Asset gets created — approval
  /// alone creates neither. Uses the actual amount entered here, which may
  /// differ from the request's own estimatedCost.
  async markPurchased(
    id: string,
    purchasedByUserId: string,
    dto: MarkPurchasedDto,
  ) {
    const request = await this.getRequestOrThrow(id);
    if (request.status !== PurchaseRequestStatus.APPROVED) {
      throw new AppException(
        'PURCHASE_REQUEST_NOT_APPROVED',
        'Only an approved purchase request can be marked as purchased.',
        HttpStatus.CONFLICT,
      );
    }

    // request.decidedByUserId is guaranteed set here — the APPROVED check
    // above only passes once decide() has stamped it. Created pre-approved
    // (not the usual createTransaction's Pending-for-expenses default):
    // this expense already passed through the Purchase Request's own
    // approval and the purchase itself already happened, so it must not
    // enter a second, redundant Pending queue — see
    // TransactionsService.createPreApprovedExpense.
    const expense = await this.transactionsService.createPreApprovedExpense(
      {
        category: EXPENSE_CATEGORY_LABEL[request.category],
        amount: dto.actualAmount,
        description: `Purchase Request #${request.number}: ${request.description}`,
        transactionDate: new Date().toISOString(),
        bankAccountId: dto.bankAccountId,
      },
      purchasedByUserId,
      request.decidedByUserId!,
    );

    let assetId: string | undefined;
    if (request.category === PurchaseRequestCategory.EQUIPMENT) {
      // The requester may not have an Employee profile (e.g. an Admin
      // bootstrap account) — that's an expected, non-fatal case here, not
      // a reason to fail the whole purchase action. The asset is simply
      // created unassigned (Available) instead.
      let assignedEmployeeId: string | undefined;
      try {
        const employee = await this.employeesService.getEmployeeByUserId(
          request.requestedByUserId,
        );
        assignedEmployeeId = employee.id;
      } catch {
        assignedEmployeeId = undefined;
      }
      const asset = await this.assetsService.createFromPurchase({
        name: request.description,
        purchaseCost: dto.actualAmount,
        purchaseRequestId: request.id,
        assignedEmployeeId,
      });
      assetId = asset.id;
    }

    const updated = await this.prisma.purchaseRequest.update({
      where: { id },
      data: {
        status: PurchaseRequestStatus.PURCHASED,
        actualAmount: dto.actualAmount,
        purchasedByUserId,
        purchasedAt: new Date(),
        linkedExpenseId: expense.id,
        linkedAssetId: assetId,
      },
    });
    return this.toPublicShape(updated);
  }
}
