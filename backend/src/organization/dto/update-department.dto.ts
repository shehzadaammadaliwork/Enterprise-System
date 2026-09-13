import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateDepartmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  code?: string;

  /// Pass null to detach from its current branch/parent/manager.
  @IsOptional()
  @IsUUID('4')
  branchId?: string | null;

  @IsOptional()
  @IsUUID('4')
  parentId?: string | null;

  @IsOptional()
  @IsUUID('4')
  managerUserId?: string | null;
}
