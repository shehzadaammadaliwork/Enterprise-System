import { useState, type SubmitEvent } from 'react';
import { useCreateCalendarEvent, useDeleteCalendarEvent, useUpdateCalendarEvent } from '../api/hooks';
import { useDepartmentTree } from '../../organization/api/hooks';
import { useEmployees } from '../../employees/api/hooks';
import { toDateTimeLocalInput } from '../lib/monthGrid';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Textarea } from '../../../components/ui/textarea';
import type { CalendarEventInput } from '../api/calendar.api';
import type { CalendarEventView } from '../api/types';
import type { DepartmentTreeNode } from '../../organization/api/types';

const NO_DEPARTMENT = '__none__';

function flattenDepartments(nodes: DepartmentTreeNode[] | undefined): { id: string; name: string }[] {
  if (!nodes) return [];
  return nodes.flatMap((node) => [{ id: node.id, name: node.name }, ...flattenDepartments(node.children)]);
}

interface EventFormModalProps {
  event?: CalendarEventView;
  defaultDate?: Date;
  onClose: () => void;
}

export function EventFormModal({ event, defaultDate, onClose }: EventFormModalProps) {
  const isEditing = !!event;
  const { data: departmentTree } = useDepartmentTree();
  const { data: employees } = useEmployees();
  const createMutation = useCreateCalendarEvent();
  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  const initialStart = event ? new Date(event.startAt) : (defaultDate ?? new Date());
  const initialEnd = event ? new Date(event.endAt) : (defaultDate ?? new Date());

  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [eventType, setEventType] = useState<'MEETING' | 'DEADLINE'>(
    event?.eventType === 'DEADLINE' ? 'DEADLINE' : 'MEETING',
  );
  const [startAt, setStartAt] = useState(toDateTimeLocalInput(initialStart.toISOString()));
  const [endAt, setEndAt] = useState(toDateTimeLocalInput(initialEnd.toISOString()));
  const [allDay, setAllDay] = useState(event?.allDay ?? false);
  const [location, setLocation] = useState(event?.location ?? '');
  const [departmentId, setDepartmentId] = useState(event?.departmentId ?? NO_DEPARTMENT);
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<string>(
    event?.reminderMinutesBefore ? String(event.reminderMinutesBefore) : '',
  );
  const [attendeeUserIds, setAttendeeUserIds] = useState<string[]>(event?.attendeeUserIds ?? []);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const departments = flattenDepartments(departmentTree);

  function toggleAttendee(userId: string) {
    setAttendeeUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  }

  function handleSubmit(formEvent: SubmitEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setErrorMessage(null);
    const base = {
      title,
      description: description || undefined,
      startAt: new Date(startAt).toISOString(),
      endAt: new Date(endAt).toISOString(),
      allDay,
      location: location || undefined,
      departmentId: departmentId === NO_DEPARTMENT ? undefined : departmentId,
      reminderMinutesBefore: reminderMinutesBefore ? Number(reminderMinutesBefore) : undefined,
      attendeeUserIds,
    };
    const onSuccess = () => onClose();
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save event.'));

    if (isEditing) {
      updateMutation.mutate({ id: event.id, input: base }, { onSuccess, onError });
    } else {
      createMutation.mutate({ ...base, eventType } as CalendarEventInput, { onSuccess, onError });
    }
  }

  function handleDelete() {
    if (!event || !confirm(`Delete "${event.title}"?`)) return;
    deleteMutation.mutate(event.id, {
      onSuccess: onClose,
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not delete event.')),
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal title={isEditing ? 'Edit event' : 'New event'} onClose={onClose}>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-title">Title</Label>
          <Input id="event-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        {!isEditing && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-type">Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as 'MEETING' | 'DEADLINE')}>
              <SelectTrigger id="event-type" className="w-full">
                <SelectValue>{eventType === 'MEETING' ? 'Meeting' : 'Deadline'}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="DEADLINE">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-start">Starts</Label>
            <Input id="event-start" type="datetime-local" required value={startAt} onChange={(e) => setStartAt(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-end">Ends</Label>
            <Input id="event-end" type="datetime-local" required value={endAt} onChange={(e) => setEndAt(e.target.value)} />
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={allDay} onCheckedChange={(v) => setAllDay(!!v)} />
          All day
        </label>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-description">Description</Label>
          <Textarea id="event-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-location">Location</Label>
          <Input id="event-location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-department">Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger id="event-department" className="w-full">
                <SelectValue>
                  {departmentId === NO_DEPARTMENT ? 'Company-wide' : departments.find((d) => d.id === departmentId)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_DEPARTMENT}>Company-wide</SelectItem>
                {departments.map((department) => (
                  <SelectItem key={department.id} value={department.id}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="event-reminder">Reminder (minutes before)</Label>
            <Input
              id="event-reminder"
              type="number"
              min={1}
              placeholder="None"
              value={reminderMinutesBefore}
              onChange={(e) => setReminderMinutesBefore(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Attendees</Label>
          <div className="max-h-40 space-y-2 overflow-y-auto rounded-lg border p-3">
            {!employees?.data.length ? (
              <p className="text-xs text-muted-foreground">No employees available.</p>
            ) : (
              employees.data.map((employee) => (
                <label key={employee.userId} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={attendeeUserIds.includes(employee.userId)}
                    onCheckedChange={() => toggleAttendee(employee.userId)}
                  />
                  {employee.user.firstName} {employee.user.lastName}
                </label>
              ))
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isEditing && (
            <Button
              type="button"
              variant="outline"
              className="text-destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              Delete
            </Button>
          )}
          <Button type="submit" className="flex-1" disabled={isSaving}>
            {isSaving ? 'Saving…' : isEditing ? 'Save changes' : 'Create event'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
