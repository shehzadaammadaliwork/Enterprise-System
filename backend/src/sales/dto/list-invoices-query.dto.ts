import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { InvoiceStatus } from '@prisma/client';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListInvoicesQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  customerId?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
