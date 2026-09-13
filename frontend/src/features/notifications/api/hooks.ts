import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './notifications.api';

const KEYS = {
  notifications: ['notifications'] as const,
  list: (unreadOnly: boolean) => ['notifications', 'list', unreadOnly] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  preferences: ['notifications', 'preferences'] as const,
};

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: KEYS.list(unreadOnly),
    queryFn: () => api.fetchNotifications(unreadOnly),
  });
}

export function useUnreadCount() {
  return useQuery({ queryKey: KEYS.unreadCount, queryFn: api.fetchUnreadCount });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.notifications });
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: api.markNotificationRead, onSuccess: invalidate });
}

export function useMarkNotificationUnread() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: api.markNotificationUnread, onSuccess: invalidate });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: api.markAllNotificationsRead, onSuccess: invalidate });
}

export function usePreferences() {
  return useQuery({ queryKey: KEYS.preferences, queryFn: api.fetchPreferences });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.updatePreferences,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.preferences }),
  });
}

export function useBroadcastAnnouncement() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: api.broadcastAnnouncement, onSuccess: invalidate });
}
