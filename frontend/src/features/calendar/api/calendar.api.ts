import { apiClient } from '../../../shared/api/client';
import type { CalendarEventType, CalendarEventView } from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

export interface CalendarEventFilters {
  dateFrom: string;
  dateTo: string;
  departmentId?: string;
}

export async function fetchCalendarEvents(filters: CalendarEventFilters) {
  const res = await apiClient.get<Envelope<CalendarEventView[]>>('/calendar/events', {
    params: filters,
  });
  return res.data.data;
}

export async function fetchCalendarEvent(id: string) {
  const res = await apiClient.get<Envelope<CalendarEventView>>(`/calendar/events/${id}`);
  return res.data.data;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  eventType: Extract<CalendarEventType, 'MEETING' | 'DEADLINE'>;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  location?: string;
  departmentId?: string;
  reminderMinutesBefore?: number;
  attendeeUserIds?: string[];
}

export async function createCalendarEvent(input: CalendarEventInput) {
  const res = await apiClient.post<Envelope<CalendarEventView>>('/calendar/events', input);
  return res.data.data;
}

export async function updateCalendarEvent(id: string, input: Partial<Omit<CalendarEventInput, 'eventType'>>) {
  const res = await apiClient.patch<Envelope<CalendarEventView>>(`/calendar/events/${id}`, input);
  return res.data.data;
}

export async function deleteCalendarEvent(id: string) {
  await apiClient.delete(`/calendar/events/${id}`);
}
