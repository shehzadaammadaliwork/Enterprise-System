"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchaseRequestsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
const transactions_service_1 = require("../../finance/services/transactions.service");
const employees_service_1 = require("../../employees/services/employees.service");
const assets_service_1 = require("../../assets/services/assets.service");
const notifications_service_1 = require("../../notifications/services/notifications.service");
const rbac_service_1 = require("../../rbac/rbac.service");
const EXPENSE_CATEGORY_LABEL = {
    EQUIPMENT: 'Equipment',
    SOFTWARE_SUBSCRIPTION: 'Software & Subscriptions',
    OTHER: 'Other',
};
let PurchaseRequestsService = class PurchaseRequestsService {
    prisma;
    transactionsService;
    employeesService;
    assetsService;
    notificationsService;
    rbacService;
    constructor(prisma, transactionsService, employeesService, assetsService, notificationsService, rbacService) {
        this.prisma = prisma;
        this.transactionsService = transactionsService;
        this.employeesService = employeesService;
        this.assetsService = assetsService;
        this.notificationsService = notificationsService;
        this.rbacService = rbacService;
    }
    toPublicShape(request) {
        return {
            ...request,
            estimatedCost: Number(request.estimatedCost),
            actualAmount: request.actualAmount === null ? null : Number(request.actualAmount),
        };
    }
    async createRequest(requestedByUserId, dto) {
        const request = await this.prisma.purchaseRequest.create({
            data: { ...dto, requestedByUserId },
        });
        const approverUserIds = await this.rbacService.getUserIdsWithPermission('procurement', 'EDIT');
        await Promise.all(approverUserIds.map((userId) => this.notificationsService.notify(userId, client_1.NotificationEventType.PURCHASE_REQUEST_SUBMITTED, 'New purchase request', `Purchase request #${request.number} ("${request.description}") is awaiting your review.`, { purchaseRequestId: request.id })));
        return this.toPublicShape(request);
    }
    async listRequests(query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async listMyRequests(requestedByUserId, query) {
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = { requestedByUserId };
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
            meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total),
        };
    }
    async getRequestOrThrow(id) {
        const request = await this.prisma.purchaseRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new app_exception_1.AppException('PURCHASE_REQUEST_NOT_FOUND', 'Purchase request not found.', common_1.HttpStatus.NOT_FOUND);
        return request;
    }
    async getRequest(id) {
        return this.toPublicShape(await this.getRequestOrThrow(id));
    }
    async decide(id, decidedByUserId, approve) {
        const request = await this.getRequestOrThrow(id);
        if (request.status !== client_1.PurchaseRequestStatus.PENDING) {
            throw new app_exception_1.AppException('PURCHASE_REQUEST_ALREADY_DECIDED', 'This purchase request has already been decided.', common_1.HttpStatus.CONFLICT);
        }
        const updated = await this.prisma.purchaseRequest.update({
            where: { id },
            data: {
                status: approve
                    ? client_1.PurchaseRequestStatus.APPROVED
                    : client_1.PurchaseRequestStatus.REJECTED,
                decidedByUserId,
                decidedAt: new Date(),
            },
        });
        await this.notificationsService.notify(request.requestedByUserId, client_1.NotificationEventType.PURCHASE_REQUEST_DECIDED, `Purchase request ${approve ? 'approved' : 'rejected'}`, `Your purchase request #${request.number} ("${request.description}") has been ${approve ? 'approved' : 'rejected'}.`, { purchaseRequestId: id });
        return this.toPublicShape(updated);
    }
    async markPurchased(id, purchasedByUserId, dto) {
        const request = await this.getRequestOrThrow(id);
        if (request.status !== client_1.PurchaseRequestStatus.APPROVED) {
            throw new app_exception_1.AppException('PURCHASE_REQUEST_NOT_APPROVED', 'Only an approved purchase request can be marked as purchased.', common_1.HttpStatus.CONFLICT);
        }
        const expense = await this.transactionsService.createPreApprovedExpense({
            category: EXPENSE_CATEGORY_LABEL[request.category],
            amount: dto.actualAmount,
            description: `Purchase Request #${request.number}: ${request.description}`,
            transactionDate: new Date().toISOString(),
            bankAccountId: dto.bankAccountId,
        }, purchasedByUserId, request.decidedByUserId);
        let assetId;
        if (request.category === client_1.PurchaseRequestCategory.EQUIPMENT) {
            let assignedEmployeeId;
            try {
                const employee = await this.employeesService.getEmployeeByUserId(request.requestedByUserId);
                assignedEmployeeId = employee.id;
            }
            catch {
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
                status: client_1.PurchaseRequestStatus.PURCHASED,
                actualAmount: dto.actualAmount,
                purchasedByUserId,
                purchasedAt: new Date(),
                linkedExpenseId: expense.id,
                linkedAssetId: assetId,
            },
        });
        return this.toPublicShape(updated);
    }
};
exports.PurchaseRequestsService = PurchaseRequestsService;
exports.PurchaseRequestsService = PurchaseRequestsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        transactions_service_1.TransactionsService,
        employees_service_1.EmployeesService,
        assets_service_1.AssetsService,
        notifications_service_1.NotificationsService,
        rbac_service_1.RbacService])
], PurchaseRequestsService);
//# sourceMappingURL=purchase-requests.service.js.map