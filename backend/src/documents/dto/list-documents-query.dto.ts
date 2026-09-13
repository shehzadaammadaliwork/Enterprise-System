import { IsString, MaxLength, MinLength } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListDocumentsQueryDto extends PaginationQueryDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  entityType!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  entityId!: string;
}
