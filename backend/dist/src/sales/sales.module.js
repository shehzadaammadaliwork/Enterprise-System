"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SalesModule = void 0;
const common_1 = require("@nestjs/common");
const crm_module_1 = require("../crm/crm.module");
const products_service_1 = require("./services/products.service");
const quotes_service_1 = require("./services/quotes.service");
const orders_service_1 = require("./services/orders.service");
const invoices_service_1 = require("./services/invoices.service");
const payments_service_1 = require("./services/payments.service");
const products_controller_1 = require("./controllers/products.controller");
const quotes_controller_1 = require("./controllers/quotes.controller");
const orders_controller_1 = require("./controllers/orders.controller");
const invoices_controller_1 = require("./controllers/invoices.controller");
const payments_controller_1 = require("./controllers/payments.controller");
let SalesModule = class SalesModule {
};
exports.SalesModule = SalesModule;
exports.SalesModule = SalesModule = __decorate([
    (0, common_1.Module)({
        imports: [crm_module_1.CrmModule],
        controllers: [
            products_controller_1.ProductsController,
            quotes_controller_1.QuotesController,
            orders_controller_1.OrdersController,
            invoices_controller_1.InvoicesController,
            payments_controller_1.PaymentsController,
        ],
        providers: [
            products_service_1.ProductsService,
            quotes_service_1.QuotesService,
            orders_service_1.OrdersService,
            invoices_service_1.InvoicesService,
            payments_service_1.PaymentsService,
        ],
        exports: [invoices_service_1.InvoicesService, payments_service_1.PaymentsService],
    })
], SalesModule);
//# sourceMappingURL=sales.module.js.map