import { IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListPaymentsQueryDto extends PaginationQueryDto {
  @IsUUID('4')
  invoiceId!: string;
}
