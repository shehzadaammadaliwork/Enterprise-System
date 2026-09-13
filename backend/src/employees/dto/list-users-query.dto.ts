import {
  IsBooleanString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/pagination/pagination.dto';

export class ListUsersQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  search?: string;

  /// 'true' = only users with no linked Employee profile yet (the
  /// onboarding picker and the Users page's "Not onboarded" filter both use
  /// this); 'false' = only users who already have one; omitted = everyone.
  @IsOptional()
  @IsBooleanString()
  needsOnboarding?: string;
}
