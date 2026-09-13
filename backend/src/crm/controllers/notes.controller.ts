import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { NotesService } from '../services/notes.service';
import { RequirePermission } from '../../rbac/decorators/require-permission.decorator';
import { AuditEntity } from '../../common/decorators/audit-entity.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateNoteDto } from '../dto/create-note.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';

@Controller('crm/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  @RequirePermission('crm', 'VIEW')
  listNotes(@Query() query: ListNotesQueryDto) {
    return this.notesService.listNotes(query);
  }

  @Post()
  @RequirePermission('crm', 'CREATE')
  @AuditEntity('Note')
  createNote(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.createNote(dto, user.id);
  }

  @Delete(':id')
  @RequirePermission('crm', 'DELETE')
  @AuditEntity('Note')
  deleteNote(@Param('id') id: string) {
    return this.notesService.deleteNote(id);
  }
}
