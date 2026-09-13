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
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const app_exception_1 = require("../../common/filters/app-exception");
const pagination_dto_1 = require("../../common/pagination/pagination.dto");
let NotesService = class NotesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    requireExactlyOneTarget(target) {
        const targetCount = [
            target.leadId,
            target.customerId,
            target.dealId,
        ].filter(Boolean).length;
        if (targetCount !== 1) {
            throw new app_exception_1.AppException('NOTE_TARGET_REQUIRED', 'Exactly one of leadId, customerId or dealId must be provided.', common_1.HttpStatus.BAD_REQUEST);
        }
    }
    async listNotes(query) {
        this.requireExactlyOneTarget(query);
        const { skip, take, page, limit } = (0, pagination_dto_1.paginationSkipTake)(query);
        const where = {
            ...(query.leadId && { leadId: query.leadId }),
            ...(query.customerId && { customerId: query.customerId }),
            ...(query.dealId && { dealId: query.dealId }),
        };
        const [items, total] = await Promise.all([
            this.prisma.note.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.note.count({ where }),
        ]);
        return { items, meta: (0, pagination_dto_1.buildPaginationMeta)(page, limit, total) };
    }
    async createNote(dto, createdByUserId) {
        this.requireExactlyOneTarget(dto);
        return this.prisma.note.create({ data: { ...dto, createdByUserId } });
    }
    async getNote(id) {
        const note = await this.prisma.note.findUnique({ where: { id } });
        if (!note)
            throw new app_exception_1.AppException('NOTE_NOT_FOUND', 'Note not found.', common_1.HttpStatus.NOT_FOUND);
        return note;
    }
    async deleteNote(id) {
        await this.getNote(id);
        await this.prisma.note.delete({ where: { id } });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map