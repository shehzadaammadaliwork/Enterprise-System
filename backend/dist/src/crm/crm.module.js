"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrmModule = void 0;
const common_1 = require("@nestjs/common");
const leads_service_1 = require("./services/leads.service");
const customers_service_1 = require("./services/customers.service");
const deals_service_1 = require("./services/deals.service");
const activities_service_1 = require("./services/activities.service");
const notes_service_1 = require("./services/notes.service");
const leads_controller_1 = require("./controllers/leads.controller");
const customers_controller_1 = require("./controllers/customers.controller");
const deals_controller_1 = require("./controllers/deals.controller");
const activities_controller_1 = require("./controllers/activities.controller");
const notes_controller_1 = require("./controllers/notes.controller");
let CrmModule = class CrmModule {
};
exports.CrmModule = CrmModule;
exports.CrmModule = CrmModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            leads_controller_1.LeadsController,
            customers_controller_1.CustomersController,
            deals_controller_1.DealsController,
            activities_controller_1.ActivitiesController,
            notes_controller_1.NotesController,
        ],
        providers: [
            leads_service_1.LeadsService,
            customers_service_1.CustomersService,
            deals_service_1.DealsService,
            activities_service_1.ActivitiesService,
            notes_service_1.NotesService,
        ],
        exports: [customers_service_1.CustomersService, deals_service_1.DealsService],
    })
], CrmModule);
//# sourceMappingURL=crm.module.js.map