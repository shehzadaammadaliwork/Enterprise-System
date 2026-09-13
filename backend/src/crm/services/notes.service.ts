import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import {
  buildPaginationMeta,
  paginationSkipTake,
} from '../../common/pagination/pagination.dto';
import { CreateNoteDto } from '../dto/create-note.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  /// Exactly one of leadId/customerId/dealId must be set — Note attaches
  /// to one of Lead/Customer/Deal, never zero or several at once.
  private requireExactlyOneTarget(target: {
    leadId?: string;
    customerId?: string;
    dealId?: string;
  }): void {
    const targetCount = [
      target.leadId,
      target.customerId,
      target.dealId,
    ].filter(Boolean).length;
    if (targetCount !== 1) {
      throw new AppException(
        'NOTE_TARGET_REQUIRED',
        'Exactly one of leadId, customerId or dealId must be provided.',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async listNotes(query: ListNotesQueryDto) {
    this.requireExactlyOneTarget(query);
    const { skip, take, page, limit } = paginationSkipTake(query);
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
    return { items, meta: buildPaginationMeta(page, limit, total) };
  }

  async createNote(dto: CreateNoteDto, createdByUserId: string) {
    this.requireExactlyOneTarget(dto);
    return this.prisma.note.create({ data: { ...dto, createdByUserId } });
  }

  async getNote(id: string) {
    const note = await this.prisma.note.findUnique({ where: { id } });
    if (!note)
      throw new AppException(
        'NOTE_NOT_FOUND',
        'Note not found.',
        HttpStatus.NOT_FOUND,
      );
    return note;
  }

  async deleteNote(id: string): Promise<void> {
    await this.getNote(id);
    await this.prisma.note.delete({ where: { id } });
  }
}
