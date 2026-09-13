import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/// Cron validation here is intentionally shallow (5 whitespace-separated
/// fields) — real syntax validation happens for free the moment
/// BackupSchedulerService hands the string to `cron`'s CronJob constructor,
/// which throws on anything actually malformed; this just catches obviously
/// wrong input early with a clearer error than that library gives.
const CRON_SHAPE_PATTERN = /^\S+\s+\S+\s+\S+\s+\S+\s+\S+$/;

export class UpdateSettingsDto {
  @IsOptional()
  @IsString()
  @Matches(HEX_COLOR_PATTERN, {
    message: 'brandPrimaryColor must be a hex color, e.g. #2563eb',
  })
  brandPrimaryColor?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  @IsString()
  currencyLocale?: string;

  /// Null explicitly disables scheduled backups (IsOptional treats null the
  /// same as undefined — skips IsString/Matches below — so it passes
  /// through untouched); omitted leaves the stored value unchanged.
  @IsOptional()
  @IsString()
  @Matches(CRON_SHAPE_PATTERN, {
    message: 'backupSchedule must be a 5-field cron expression',
  })
  backupSchedule?: string | null;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(90)
  backupRetentionCount?: number;
}
