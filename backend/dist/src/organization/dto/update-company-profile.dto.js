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
exports.UpdateCompanyProfileDto = void 0;
const class_validator_1 = require("class-validator");
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
class UpdateCompanyProfileDto {
    name;
    fiscalYearStartMonth;
    workingHoursStart;
    workingHoursEnd;
}
exports.UpdateCompanyProfileDto = UpdateCompanyProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(200),
    __metadata("design:type", String)
], UpdateCompanyProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateCompanyProfileDto.prototype, "fiscalYearStartMonth", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_PATTERN, {
        message: 'workingHoursStart must be in HH:mm 24h format',
    }),
    __metadata("design:type", String)
], UpdateCompanyProfileDto.prototype, "workingHoursStart", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(TIME_PATTERN, {
        message: 'workingHoursEnd must be in HH:mm 24h format',
    }),
    __metadata("design:type", String)
], UpdateCompanyProfileDto.prototype, "workingHoursEnd", void 0);
//# sourceMappingURL=update-company-profile.dto.js.map