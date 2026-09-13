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
exports.UpdatePreferencesDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class PreferenceEntryDto {
    eventType;
    channel;
    enabled;
}
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationEventType),
    __metadata("design:type", String)
], PreferenceEntryDto.prototype, "eventType", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.NotificationChannel),
    __metadata("design:type", String)
], PreferenceEntryDto.prototype, "channel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], PreferenceEntryDto.prototype, "enabled", void 0);
class UpdatePreferencesDto {
    preferences;
}
exports.UpdatePreferencesDto = UpdatePreferencesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PreferenceEntryDto),
    __metadata("design:type", Array)
], UpdatePreferencesDto.prototype, "preferences", void 0);
//# sourceMappingURL=update-preferences.dto.js.map