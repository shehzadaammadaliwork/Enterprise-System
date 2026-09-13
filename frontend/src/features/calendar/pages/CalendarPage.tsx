import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCalendarEvents } from '../api/hooks';
import { useDepartmentTree } from '../../organization/api/hooks';
import { EventFormModal } from '../components/EventFormModal';
import { ReadOnlyEventModal } from '../components/ReadOnlyEventModal';
import { buildMonthGrid, isSameDay } from '../lib/monthGrid';
import { EVENT_TYPE_COLORS } from '../api/types';
import { useAuthStore } from '../../../shared/stores/auth.store';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { cn } from '../../../lib/utils';
import type { CalendarEventView } from '../api/types';
import type { DepartmentTreeNode } from '../../organization/api/types';

const NO_DEPARTMENT_FILTER = '__all__';
const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_CHIPS_PER_DAY = 3;

function flattenDepartments(nodes: DepartmentTreeNode[] | undefined): { id: string; name: string }[] {
  if (!nodes) return [];
  return nodes.flatMap((node) => [{ id: node.id, name: node.name }, ...flattenDepartments(node.children)]);
}

export function CalendarPage() {
  const today = useMemo(() => new Date(), []);
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [departmentId, setDepartmentId] = useState(NO_DEPARTMENT_FILTER);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventView | null>(null);
  const [creatingOnDate, setCreatingOnDate] = useState<Date | null>(null);

  const canCreate = useAuthStore((state) => state.hasPermission('calendar', 'CREATE'));
  const { data: departmentTree } = useDepartmentTree();
  const departments = flattenDepartments(departmentTree);

  const { weeks, rangeStart, rangeEnd } = useMemo(
    () => buildMonthGrid(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate],
  );

  const { data: events, isLoading } = useCalendarEvents({
    dateFrom: rangeStart.toISOString(),
    dateTo: rangeEnd.toISOString(),
    departmentId: departmentId === NO_DEPARTMENT_FILTER ? undefined : departmentId,
  });

  function eventsForDay(day: Date): CalendarEventView[] {
    if (!events) return [];
    return events.filter((event) => {
      const start = new Date(event.startAt);
      const end = new Date(event.endAt);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 23, 59, 59, 999);
      return start <= dayEnd && end >= dayStart;
    });
  }

  function goToMonth(offset: number) {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function handleEventClick(event: CalendarEventView) {
    setSelectedEvent(event);
  }

  function handleDayClick(day: Date) {
    if (!canCreate) return;
    setCreatingOnDate(day);
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Meetings, deadlines, approved leave and company holidays.
          </p>
        </div>
        {canCreate && (
          <Button type="button" size="sm" onClick={() => setCreatingOnDate(today)}>
            New event
          </Button>
        )}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="icon" onClick={() => goToMonth(-1)} aria-label="Previous month">
            <ChevronLeft className="size-4" />
          </Button>
          <div className="min-w-40 text-center text-sm font-medium">
            {viewDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => goToMonth(1)} aria-label="Next month">
            <ChevronRight className="size-4" />
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}>
            Today
          </Button>
        </div>

        <Select value={departmentId} onValueChange={setDepartmentId}>
          <SelectTrigger className="w-56">
            <SelectValue>
              {departmentId === NO_DEPARTMENT_FILTER ? 'Company-wide' : departments.find((d) => d.id === departmentId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_DEPARTMENT_FILTER}>Company-wide</SelectItem>
            {departments.map((department) => (
              <SelectItem key={department.id} value={department.id}>
                {department.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <div className="grid grid-cols-7 border-b bg-muted/50 text-xs font-medium text-muted-foreground">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="px-2 py-2 text-center">
                {label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {weeks.flat().map((day) => {
              const dayEvents = eventsForDay(day);
              const isCurrentMonth = day.getMonth() === viewDate.getMonth();
              const isToday = isSameDay(day, today);
              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    'flex min-h-28 flex-col gap-1 border-b border-r p-1.5 last:border-r-0',
                    !isCurrentMonth && 'bg-muted/20 text-muted-foreground',
                    canCreate && 'cursor-pointer hover:bg-muted/40',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full text-xs',
                      isToday && 'bg-primary font-semibold text-primary-foreground',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <div className="flex flex-col gap-1">
                    {dayEvents.slice(0, MAX_CHIPS_PER_DAY).map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEventClick(event);
                        }}
                        className={cn(
                          'truncate rounded border px-1.5 py-0.5 text-left text-[11px] font-medium',
                          EVENT_TYPE_COLORS[event.eventType],
                        )}
                        title={event.title}
                      >
                        {event.title}
                      </button>
                    ))}
                    {dayEvents.length > MAX_CHIPS_PER_DAY && (
                      <span className="text-[11px] text-muted-foreground">
                        +{dayEvents.length - MAX_CHIPS_PER_DAY} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {creatingOnDate && <EventFormModal defaultDate={creatingOnDate} onClose={() => setCreatingOnDate(null)} />}
      {selectedEvent && !selectedEvent.readOnly && (
        <EventFormModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
      {selectedEvent && selectedEvent.readOnly && (
        <ReadOnlyEventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
