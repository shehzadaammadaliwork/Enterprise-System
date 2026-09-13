import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { QuoteStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListQuotesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}
