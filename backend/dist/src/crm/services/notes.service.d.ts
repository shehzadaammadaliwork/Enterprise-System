import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateNoteDto } from '../dto/create-note.dto';
import { ListNotesQueryDto } from '../dto/list-notes-query.dto';
export declare class NotesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private requireExactlyOneTarget;
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
    createNote(dto: CreateNoteDto, createdByUserId: string): Promise<{
        id: string;
        createdAt: Date;
        createdByUserId: string | null;
        customerId: string | null;
        body: string;
        leadId: string | null;
        dealId: string | null;
    }>;
    getNote(id: string): Promise<{
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
