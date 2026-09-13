import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID('4')
  userId!: string;

  /// Admin/HR must select at least one RBAC role when creating an
  /// employee — a hard validation, not a soft warning (spec Section 2).
  /// Designation (below) is HR-descriptive only and never auto-derives
  /// access; roles are the only thing that grants it.
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  roleIds!: string[];

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(150)
  designation!: string;

  @IsDateString()
  joiningDate!: string;

  @IsOptional()
  @IsUUID('4')
  reportingManagerId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salary!: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine1?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  addressLine2?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  emergencyContactName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  emergencyContactPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  emergencyContactRelation?: string;
}
