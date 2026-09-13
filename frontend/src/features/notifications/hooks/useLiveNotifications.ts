import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../../shared/websocket/socket';

/// Subscribes to the 'notification:new' event NotificationsProcessor emits
/// (Architecture Rule: "pushed live via WebSockets") and invalidates the
/// notification queries so the bell/list pick it up without polling.
/// Mounted once in AppLayout — every authenticated route shares one socket
/// (shared/websocket/socket.ts), so this is the one place that needs to
/// listen, not a per-page concern.
export function useLiveNotifications() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };
    socket.on('notification:new', handler);
    return () => {
      socket.off('notification:new', handler);
    };
  }, [queryClient]);
}
