import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { CalendarEventType } from '@prisma/client';

/// Only MEETING/DEADLINE are creatable here — LEAVE/HOLIDAY are read-only
/// synthetic entries merged in at list time (see this module's schema
/// header comment), never rows a user writes directly.
const CREATABLE_EVENT_TYPES: CalendarEventType[] = ['MEETING', 'DEADLINE'];

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsIn(CREATABLE_EVENT_TYPES)
  eventType!: CalendarEventType;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  endAt!: string;

  @IsOptional()
  @IsBoolean()
  allDay?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @IsUUID('4')
  departmentId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10080) // 1 week
  reminderMinutesBefore?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  attendeeUserIds?: string[];
}
