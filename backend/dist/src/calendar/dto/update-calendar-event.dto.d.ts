export declare class UpdateCalendarEventDto {
    title?: string;
    description?: string;
    startAt?: string;
    endAt?: string;
    allDay?: boolean;
    location?: string;
    departmentId?: string;
    reminderMinutesBefore?: number;
    attendeeUserIds?: string[];
}
