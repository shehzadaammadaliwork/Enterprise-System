import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { AssetStatus } from '@prisma/client';

export class ChangeAssetStatusDto {
  @IsEnum(AssetStatus)
  status!: AssetStatus;

  /// Required (and only meaningful) when status is ASSIGNED — validated
  /// in AssetsService.changeStatus, not here, since the requirement is
  /// conditional on another field.
  @IsOptional()
  @IsUUID('4')
  assignedEmployeeId?: string;

  /// Only meaningful when status is RETIRED.
  @IsOptional()
  @IsString()
  @MaxLength(500)
  retirementReason?: string;
}
