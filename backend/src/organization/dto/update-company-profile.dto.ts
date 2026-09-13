import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export class UpdateCompanyProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  fiscalYearStartMonth?: number;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, {
    message: 'workingHoursStart must be in HH:mm 24h format',
  })
  workingHoursStart?: string;

  @IsOptional()
  @IsString()
  @Matches(TIME_PATTERN, {
    message: 'workingHoursEnd must be in HH:mm 24h format',
  })
  workingHoursEnd?: string;
}
