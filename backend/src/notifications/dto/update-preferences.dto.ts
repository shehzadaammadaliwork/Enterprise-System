import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { NotificationChannel, NotificationEventType } from '@prisma/client';

class PreferenceEntryDto {
  @IsEnum(NotificationEventType)
  eventType!: NotificationEventType;

  @IsEnum(NotificationChannel)
  channel!: NotificationChannel;

  @IsBoolean()
  enabled!: boolean;
}

/// Bulk upsert — the preferences page saves its whole toggle grid in one
/// request rather than one PATCH per checkbox.
export class UpdatePreferencesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PreferenceEntryDto)
  preferences!: PreferenceEntryDto[];
}
