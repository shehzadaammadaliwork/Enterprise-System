import { IsString, MaxLength, MinLength } from 'class-validator';

/// Non-file fields alongside the multipart upload — the file itself is
/// handled by FileInterceptor/@UploadedFile(), not part of this DTO.
export class UploadDocumentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  entityType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  entityId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title!: string;
}
