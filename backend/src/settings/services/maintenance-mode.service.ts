import { Injectable } from '@nestjs/common';

/// One in-memory boolean, set true for the duration of a live pg_restore
/// (BackupProcessor) and read by MaintenanceModeGuard. Deliberately not
/// persisted anywhere — a restart mid-restore already means something went
/// badly wrong, and this flag existing across a restart would only risk
/// permanently wedging the app in maintenance mode with no way out.
@Injectable()
export class MaintenanceModeService {
  private active = false;

  isActive(): boolean {
    return this.active;
  }

  setActive(value: boolean): void {
    this.active = value;
  }
}
