import { NotificationChannel, NotificationEventType } from '@prisma/client';
declare class PreferenceEntryDto {
    eventType: NotificationEventType;
    channel: NotificationChannel;
    enabled: boolean;
}
export declare class UpdatePreferencesDto {
    preferences: PreferenceEntryDto[];
}
export {};
