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
exports.TriggerPayrollRunDto = void 0;
const client_1 = require("@prisma/client");
const class_validator_1 = require("class-validator");
class TriggerPayrollRunDto {
    month;
    year;
    scope;
    employeeIds;
}
exports.TriggerPayrollRunDto = TriggerPayrollRunDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], TriggerPayrollRunDto.prototype, "month", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(2000),
    (0, class_validator_1.Max)(2100),
    __metadata("design:type", Number)
], TriggerPayrollRunDto.prototype, "year", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.PayrollRunScope),
    __metadata("design:type", String)
], TriggerPayrollRunDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((o) => o.scope === client_1.PayrollRunScope.SELECTED),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsUUID)('4', { each: true }),
    __metadata("design:type", Array)
], TriggerPayrollRunDto.prototype, "employeeIds", void 0);
//# sourceMappingURL=trigger-payroll-run.dto.js.map