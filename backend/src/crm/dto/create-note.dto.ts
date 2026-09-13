import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/// Exactly one of leadId/customerId/dealId must be set — enforced in
/// NotesService.createNote (see NOTE_TARGET_REQUIRED), not here, since
/// class-validator's built-in decorators can't express an XOR across
/// sibling fields.
export class CreateNoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body!: string;

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
