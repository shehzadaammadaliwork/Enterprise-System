import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

/// Exactly one of leadId/customerId/dealId must be set — enforced in
/// NotesService.listNotes (see NOTE_TARGET_REQUIRED).
export class ListNotesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  leadId?: string;

  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsUUID('4')
  dealId?: string;
}
