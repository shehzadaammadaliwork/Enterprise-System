import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchDashboardSummary } from './dashboard.api';
import { getSocket } from '../../../shared/websocket/socket';

const SUMMARY_KEY = ['dashboard', 'summary'];

export function useDashboardSummary(enabled = true) {
  return useQuery({ queryKey: SUMMARY_KEY, queryFn: fetchDashboardSummary, enabled });
}

/// Spec: "live updates pushed via WebSockets, not full page reloads" —
/// AuditLogInterceptor emits 'dashboard:update' on every successful
/// mutation under an HR/Sales/Finance route (see its own doc comment); this
/// just invalidates the one summary query so React Query refetches quietly
/// in the background rather than the page doing anything as heavy as a
/// reload or a poll.
export function useLiveDashboard() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handler = () => {
      queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
    };
    socket.on('dashboard:update', handler);
    return () => {
      socket.off('dashboard:update', handler);
    };
  }, [queryClient]);
}
