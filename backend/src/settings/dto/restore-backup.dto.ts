import { IsString, MinLength } from 'class-validator';

/// Both fields are checked by BackupService against the route's own :id and
/// the fixed RESTORE_CONFIRMATION_PHRASE — confirmationBackupId proves the
/// caller consciously targeted this specific row (not a stale UI state),
/// confirmationPhrase proves conscious acknowledgement of what restore does.
export class RestoreBackupDto {
  @IsString()
  @MinLength(1)
  confirmationBackupId!: string;

  @IsString()
  @MinLength(1)
  confirmationPhrase!: string;
}
