import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { DocumentAccessScope } from '@prisma/client';

export class SetDocumentAccessDto {
  @IsEnum(DocumentAccessScope)
  scope!: DocumentAccessScope;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  userIds?: string[];
}
