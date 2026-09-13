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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("../services/orders.service");
const invoices_service_1 = require("../services/invoices.service");
const require_permission_decorator_1 = require("../../rbac/decorators/require-permission.decorator");
const audit_entity_decorator_1 = require("../../common/decorators/audit-entity.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const update_order_dto_1 = require("../dto/update-order.dto");
const list_orders_query_dto_1 = require("../dto/list-orders-query.dto");
let OrdersController = class OrdersController {
    ordersService;
    invoicesService;
    constructor(ordersService, invoicesService) {
        this.ordersService = ordersService;
        this.invoicesService = invoicesService;
    }
    listOrders(query) {
        return this.ordersService.listOrders(query);
    }
    getOrder(id) {
        return this.ordersService.getOrder(id);
    }
    updateOrder(id, dto) {
        return this.ordersService.updateOrder(id, dto);
    }
    generateInvoice(id, user) {
        return this.invoicesService.generateFromOrder(id, user.id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'VIEW'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [list_orders_query_dto_1.ListOrdersQueryDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "listOrders", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'VIEW'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'EDIT'),
    (0, audit_entity_decorator_1.AuditEntity)('Order'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_order_dto_1.UpdateOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "updateOrder", null);
__decorate([
    (0, common_1.Post)(':id/invoice'),
    (0, require_permission_decorator_1.RequirePermission)('sales', 'CREATE'),
    (0, audit_entity_decorator_1.AuditEntity)('Invoice'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "generateInvoice", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('sales/orders'),
    __metadata("design:paramtypes", [orders_service_1.OrdersService,
        invoices_service_1.InvoicesService])
], OrdersController);
//# sourceMappingURL=orders.controller.js.map