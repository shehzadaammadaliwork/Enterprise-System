import { Badge } from '../../../components/ui/badge';
import { Modal } from '../../../shared/components/Modal';
import { EVENT_TYPE_LABELS } from '../api/types';
import type { CalendarEventView } from '../api/types';

interface ReadOnlyEventModalProps {
  event: CalendarEventView;
  onClose: () => void;
}

export function ReadOnlyEventModal({ event, onClose }: ReadOnlyEventModalProps) {
  const dateLabel = event.allDay
    ? new Date(event.startAt).toLocaleDateString()
    : `${new Date(event.startAt).toLocaleString()} – ${new Date(event.endAt).toLocaleString()}`;

  return (
    <Modal title={event.title} onClose={onClose}>
      <div className="flex flex-col gap-3">
        <Badge variant="secondary" className="w-fit">
          {EVENT_TYPE_LABELS[event.eventType]}
        </Badge>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
        {event.description && <p className="text-sm">{event.description}</p>}
        <p className="text-xs text-muted-foreground">
          Automatically shown on the calendar — {event.eventType === 'HOLIDAY' ? 'a company holiday' : 'an approved leave request'},
          not directly editable here.
        </p>
      </div>
    </Modal>
  );
}
