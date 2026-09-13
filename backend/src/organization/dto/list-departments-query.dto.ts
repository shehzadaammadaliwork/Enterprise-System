import { IsOptional, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListDepartmentsQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  branchId?: string;
}
