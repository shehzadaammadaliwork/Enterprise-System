"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeesModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const rbac_module_1 = require("../rbac/rbac.module");
const notifications_module_1 = require("../notifications/notifications.module");
const employees_service_1 = require("./services/employees.service");
const attendance_service_1 = require("./services/attendance.service");
const leave_service_1 = require("./services/leave.service");
const payroll_service_1 = require("./services/payroll.service");
const performance_review_service_1 = require("./services/performance-review.service");
const employees_controller_1 = require("./controllers/employees.controller");
const users_controller_1 = require("./controllers/users.controller");
const attendance_controller_1 = require("./controllers/attendance.controller");
const leave_controller_1 = require("./controllers/leave.controller");
const payroll_controller_1 = require("./controllers/payroll.controller");
const performance_review_controller_1 = require("./controllers/performance-review.controller");
const payroll_processor_1 = require("./processors/payroll.processor");
let EmployeesModule = class EmployeesModule {
};
exports.EmployeesModule = EmployeesModule;
exports.EmployeesModule = EmployeesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({ name: payroll_service_1.PAYROLL_QUEUE }),
            rbac_module_1.RbacModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [
            employees_controller_1.EmployeesController,
            users_controller_1.UsersController,
            attendance_controller_1.AttendanceController,
            leave_controller_1.LeaveController,
            payroll_controller_1.PayrollController,
            performance_review_controller_1.PerformanceReviewController,
            performance_review_controller_1.MyPerformanceReviewController,
        ],
        providers: [
            employees_service_1.EmployeesService,
            attendance_service_1.AttendanceService,
            leave_service_1.LeaveService,
            payroll_service_1.PayrollService,
            performance_review_service_1.PerformanceReviewService,
            payroll_processor_1.PayrollProcessor,
        ],
        exports: [employees_service_1.EmployeesService, leave_service_1.LeaveService, attendance_service_1.AttendanceService],
    })
], EmployeesModule);
//# sourceMappingURL=employees.module.js.map