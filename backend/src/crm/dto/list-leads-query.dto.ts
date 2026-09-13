import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { LeadStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListLeadsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;
}
