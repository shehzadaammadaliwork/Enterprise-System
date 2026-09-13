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
exports.FieldEncryptionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
let FieldEncryptionService = class FieldEncryptionService {
    key;
    constructor(configService) {
        const rawKey = configService.get('encryption', { infer: true }).fieldKey;
        this.key = (0, crypto_1.createHash)('sha256').update(rawKey).digest();
    }
    encrypt(plainText) {
        const iv = (0, crypto_1.randomBytes)(IV_LENGTH);
        const cipher = (0, crypto_1.createCipheriv)(ALGORITHM, this.key, iv);
        const encrypted = Buffer.concat([
            cipher.update(plainText, 'utf8'),
            cipher.final(),
        ]);
        const authTag = cipher.getAuthTag();
        return [
            iv.toString('base64'),
            authTag.toString('base64'),
            encrypted.toString('base64'),
        ].join(':');
    }
    decrypt(cipherText) {
        const [ivB64, authTagB64, dataB64] = cipherText.split(':');
        if (!ivB64 || !authTagB64 || !dataB64) {
            throw new Error('Malformed ciphertext');
        }
        const decipher = (0, crypto_1.createDecipheriv)(ALGORITHM, this.key, Buffer.from(ivB64, 'base64'));
        decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
        const decrypted = Buffer.concat([
            decipher.update(Buffer.from(dataB64, 'base64')),
            decipher.final(),
        ]);
        return decrypted.toString('utf8');
    }
};
exports.FieldEncryptionService = FieldEncryptionService;
exports.FieldEncryptionService = FieldEncryptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FieldEncryptionService);
//# sourceMappingURL=encryption.service.js.map