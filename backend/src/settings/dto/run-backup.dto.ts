import { IsIn, IsOptional } from 'class-validator';
import { BACKUP_TYPES } from '../constants/backup.constants';
import type { BackupType } from '../constants/backup.constants';

export class RunBackupDto {
  @IsOptional()
  @IsIn(BACKUP_TYPES)
  type?: BackupType = 'FULL';
}
