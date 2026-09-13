import { PayrollRunScope } from '@prisma/client';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsUUID,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class TriggerPayrollRunDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  @Max(2100)
  year!: number;

  @IsOptional()
  @IsEnum(PayrollRunScope)
  scope?: PayrollRunScope;

  @ValidateIf((o: TriggerPayrollRunDto) => o.scope === PayrollRunScope.SELECTED)
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  employeeIds?: string[];
}
