export type NotificationEventType =
  | 'LEAVE_REQUEST_SUBMITTED'
  | 'LEAVE_REQUEST_DECIDED'
  | 'PURCHASE_REQUEST_SUBMITTED'
  | 'PURCHASE_REQUEST_DECIDED'
  | 'SYSTEM_ANNOUNCEMENT'
  | 'CALENDAR_EVENT_INVITED'
  | 'CALENDAR_EVENT_REMINDER';

export type NotificationChannel = 'IN_APP' | 'EMAIL' | 'SMS' | 'PUSH';

export interface AppNotification {
  id: string;
  userId: string;
  eventType: NotificationEventType;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationPreferenceEntry {
  eventType: NotificationEventType;
  channel: NotificationChannel;
  enabled: boolean;
}

export const EVENT_TYPE_LABELS: Record<NotificationEventType, string> = {
  LEAVE_REQUEST_SUBMITTED: 'Leave request submitted',
  LEAVE_REQUEST_DECIDED: 'Leave request decided',
  PURCHASE_REQUEST_SUBMITTED: 'Purchase request submitted',
  PURCHASE_REQUEST_DECIDED: 'Purchase request decided',
  SYSTEM_ANNOUNCEMENT: 'System announcements',
  CALENDAR_EVENT_INVITED: 'Calendar invite',
  CALENDAR_EVENT_REMINDER: 'Calendar reminder',
};

export const CHANNEL_LABELS: Record<NotificationChannel, string> = {
  IN_APP: 'In-app',
  EMAIL: 'Email',
  SMS: 'SMS',
  PUSH: 'Push',
};
