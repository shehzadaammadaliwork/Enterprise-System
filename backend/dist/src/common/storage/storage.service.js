"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var StorageService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const path_1 = require("path");
const app_exception_1 = require("../filters/app-exception");
const common_2 = require("@nestjs/common");
const DEFAULT_MAX_SIZE_BYTES = 25 * 1024 * 1024;
let StorageService = StorageService_1 = class StorageService {
    logger = new common_1.Logger(StorageService_1.name);
    root = (0, path_1.resolve)(process.env.STORAGE_ROOT ?? (0, path_1.join)(process.cwd(), 'storage'));
    async save(options) {
        const { folder, fileName, buffer, mimeType } = options;
        const maxSize = options.maxSizeBytes ?? DEFAULT_MAX_SIZE_BYTES;
        if (buffer.length > maxSize) {
            throw new app_exception_1.AppException('FILE_TOO_LARGE', `File exceeds maximum size of ${maxSize} bytes.`, common_2.HttpStatus.BAD_REQUEST);
        }
        if (options.allowedMimeTypes &&
            !options.allowedMimeTypes.includes(mimeType)) {
            throw new app_exception_1.AppException('FILE_TYPE_NOT_ALLOWED', `File type ${mimeType} is not allowed.`, common_2.HttpStatus.BAD_REQUEST);
        }
        const safeFolder = this.sanitizeSegment(folder);
        const ext = (0, path_1.extname)(fileName);
        const key = (0, path_1.join)(safeFolder, `${(0, crypto_1.randomUUID)()}${ext}`);
        const absolutePath = this.resolveWithinRoot(key);
        await (0, promises_1.mkdir)((0, path_1.join)(absolutePath, '..'), { recursive: true });
        await (0, promises_1.writeFile)(absolutePath, buffer);
        const checksum = (0, crypto_1.createHash)('sha256').update(buffer).digest('hex');
        this.logger.log(`Saved file ${key} (${buffer.length} bytes)`);
        return {
            key: key.split(path_1.sep).join('/'),
            originalName: fileName,
            mimeType,
            sizeBytes: buffer.length,
            checksum,
        };
    }
    async read(key) {
        return (0, promises_1.readFile)(this.resolveWithinRoot(key));
    }
    createReadStream(key) {
        return (0, fs_1.createReadStream)(this.resolveWithinRoot(key));
    }
    async exists(key) {
        try {
            await (0, promises_1.stat)(this.resolveWithinRoot(key));
            return true;
        }
        catch {
            return false;
        }
    }
    async delete(key) {
        await (0, promises_1.unlink)(this.resolveWithinRoot(key)).catch(() => {
        });
    }
    getRootPath() {
        return this.root;
    }
    resolveWithinRoot(key) {
        const absolute = (0, path_1.resolve)(this.root, key);
        if (!absolute.startsWith(this.root + path_1.sep) && absolute !== this.root) {
            throw new app_exception_1.AppException('INVALID_PATH', 'Resolved path escapes storage root.', common_2.HttpStatus.BAD_REQUEST);
        }
        return absolute;
    }
    sanitizeSegment(segment) {
        return segment
            .split('/')
            .map((part) => part.replace(/[^a-zA-Z0-9_.-]/g, '_'))
            .filter((part) => part && part !== '.' && part !== '..')
            .join('/');
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = StorageService_1 = __decorate([
    (0, common_1.Injectable)()
], StorageService);
//# sourceMappingURL=storage.service.js.map