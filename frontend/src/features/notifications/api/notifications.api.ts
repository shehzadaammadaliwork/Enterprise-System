import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type { AppNotification, NotificationPreferenceEntry } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

export async function fetchNotifications(unreadOnly = false, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<AppNotification>>('/notifications', {
    params: { unreadOnly: unreadOnly || undefined, page, limit },
  });
  return res.data;
}

export async function fetchUnreadCount() {
  const res = await apiClient.get<Envelope<{ count: number }>>('/notifications/unread-count');
  return res.data.data.count;
}

export async function markNotificationRead(id: string) {
  const res = await apiClient.patch<Envelope<AppNotification>>(`/notifications/${id}/read`);
  return res.data.data;
}

export async function markNotificationUnread(id: string) {
  const res = await apiClient.patch<Envelope<AppNotification>>(`/notifications/${id}/unread`);
  return res.data.data;
}

export async function markAllNotificationsRead() {
  await apiClient.patch('/notifications/read-all');
}

export async function fetchPreferences() {
  const res = await apiClient.get<Envelope<NotificationPreferenceEntry[]>>('/notifications/preferences');
  return res.data.data;
}

export async function updatePreferences(preferences: NotificationPreferenceEntry[]) {
  const res = await apiClient.patch<Envelope<NotificationPreferenceEntry[]>>('/notifications/preferences', {
    preferences,
  });
  return res.data.data;
}

export async function broadcastAnnouncement(input: { title: string; message: string }) {
  await apiClient.post('/notifications/broadcast', input);
}
