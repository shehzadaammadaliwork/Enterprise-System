import { CalendarEventType } from '@prisma/client';
export declare class CreateCalendarEventDto {
    title: string;
    description?: string;
    eventType: CalendarEventType;
    startAt: string;
    endAt: string;
    allDay?: boolean;
    location?: string;
    departmentId?: string;
    reminderMinutesBefore?: number;
    attendeeUserIds?: string[];
}
