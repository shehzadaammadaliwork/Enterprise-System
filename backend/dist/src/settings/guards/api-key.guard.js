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
exports.ApiKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const api_keys_service_1 = require("../services/api-keys.service");
let ApiKeyGuard = class ApiKeyGuard {
    apiKeysService;
    constructor(apiKeysService) {
        this.apiKeysService = apiKeysService;
    }
    async canActivate(context) {
        const request = context
            .switchToHttp()
            .getRequest();
        const header = request.headers['x-api-key'];
        const plaintextKey = Array.isArray(header) ? header[0] : header;
        if (!plaintextKey) {
            throw new common_1.UnauthorizedException({
                code: 'API_KEY_MISSING',
                message: 'X-Api-Key header is required.',
            });
        }
        const key = await this.apiKeysService.validateKey(plaintextKey);
        if (!key) {
            throw new common_1.UnauthorizedException({
                code: 'API_KEY_INVALID',
                message: 'Invalid, revoked, or expired API key.',
            });
        }
        request.apiKey = key;
        return true;
    }
};
exports.ApiKeyGuard = ApiKeyGuard;
exports.ApiKeyGuard = ApiKeyGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_keys_service_1.ApiKeysService])
], ApiKeyGuard);
//# sourceMappingURL=api-key.guard.js.map