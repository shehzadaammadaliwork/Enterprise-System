import { DocumentAccessScope } from '@prisma/client';
export declare class SetDocumentAccessDto {
    scope: DocumentAccessScope;
    roleIds?: string[];
    userIds?: string[];
}
