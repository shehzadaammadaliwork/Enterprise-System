import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './calendar.api';
import type { CalendarEventFilters } from './calendar.api';

const KEYS = {
  events: ['calendar', 'events'] as const,
};

export function useCalendarEvents(filters: CalendarEventFilters) {
  return useQuery({
    queryKey: [...KEYS.events, filters],
    queryFn: () => api.fetchCalendarEvents(filters),
  });
}

function useInvalidateCalendarEvents() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.events });
}

export function useCreateCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({ mutationFn: api.createCalendarEvent, onSuccess: invalidate });
}

export function useUpdateCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateCalendarEvent>[1] }) =>
      api.updateCalendarEvent(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteCalendarEvent() {
  const invalidate = useInvalidateCalendarEvents();
  return useMutation({ mutationFn: api.deleteCalendarEvent, onSuccess: invalidate });
}
