import { NotesService } from '../services/notes.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CreateNoteDto } from '../dto/create-note.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    listNotes(query: ListNotesQueryDto): Promise<{
        items: {
            id: string;
            createdAt: Date;
            createdByUserId: string | null;
            customerId: string | null;
            body: string;
            leadId: string | null;
            dealId: string | null;
        }[];
        meta: import("../../common/pagination/pagination.dto").PaginationMeta;
    }>;
    createNote(user: AuthenticatedUser, dto: CreateNoteDto): Promise<{
        id: string;
        createdAt: Date;
        createdByUserId: string | null;
        customerId: string | null;
        body: string;
        leadId: string | null;
        dealId: string | null;
    }>;
    deleteNote(id: string): Promise<void>;
}
