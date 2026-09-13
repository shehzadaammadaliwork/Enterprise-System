export type CalendarEventType = 'MEETING' | 'DEADLINE' | 'LEAVE' | 'HOLIDAY';

export interface CalendarEventView {
  id: string;
  eventType: CalendarEventType;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  location: string | null;
  departmentId: string | null;
  reminderMinutesBefore: number | null;
  attendeeUserIds: string[];
  /// LEAVE/HOLIDAY entries are synthesized read-only from Employees/
  /// Organization — only MEETING/DEADLINE rows (readOnly: false) can be
  /// edited or deleted here.
  readOnly: boolean;
}

export const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  MEETING: 'Meeting',
  DEADLINE: 'Deadline',
  LEAVE: 'Leave',
  HOLIDAY: 'Holiday',
};

export const EVENT_TYPE_COLORS: Record<CalendarEventType, string> = {
  MEETING: 'bg-primary/15 text-primary border-primary/30',
  DEADLINE: 'bg-destructive/15 text-destructive border-destructive/30',
  LEAVE: 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400',
  HOLIDAY: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400',
};
