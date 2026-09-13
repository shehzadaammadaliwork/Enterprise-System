import { IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListActivitiesQueryDto extends PaginationQueryDto {
  @IsUUID('4')
  customerId!: string;
}
