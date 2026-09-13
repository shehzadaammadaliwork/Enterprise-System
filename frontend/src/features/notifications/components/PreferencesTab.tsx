import { useEffect, useState } from 'react';
import { usePreferences, useUpdatePreferences } from '../api/hooks';
import { CHANNEL_LABELS, EVENT_TYPE_LABELS, type NotificationChannel, type NotificationEventType, type NotificationPreferenceEntry } from '../api/types';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { extractApiErrorMessage } from '../../../shared/api/client';

const EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS) as NotificationEventType[];
const CHANNELS = Object.keys(CHANNEL_LABELS) as NotificationChannel[];

export function PreferencesTab() {
  const { data, isLoading } = usePreferences();
  const updateMutation = useUpdatePreferences();
  const [grid, setGrid] = useState<NotificationPreferenceEntry[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setGrid(data);
  }, [data]);

  function isEnabled(eventType: NotificationEventType, channel: NotificationChannel): boolean {
    return grid.find((p) => p.eventType === eventType && p.channel === channel)?.enabled ?? true;
  }

  function toggle(eventType: NotificationEventType, channel: NotificationChannel) {
    setSaved(false);
    setGrid((prev) =>
      prev.map((p) =>
        p.eventType === eventType && p.channel === channel ? { ...p, enabled: !p.enabled } : p,
      ),
    );
  }

  function handleSave() {
    setErrorMessage(null);
    setSaved(false);
    updateMutation.mutate(grid, {
      onSuccess: () => setSaved(true),
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not save preferences.')),
    });
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      {saved && (
        <Alert className="mb-4">
          <AlertDescription>Preferences saved.</AlertDescription>
        </Alert>
      )}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-2 text-left font-medium">Event</th>
              {CHANNELS.map((channel) => (
                <th key={channel} className="px-4 py-2 text-center font-medium">
                  {CHANNEL_LABELS[channel]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENT_TYPES.map((eventType) => (
              <tr key={eventType} className="border-b last:border-0">
                <td className="px-4 py-2.5">{EVENT_TYPE_LABELS[eventType]}</td>
                {CHANNELS.map((channel) => (
                  <td key={channel} className="px-4 py-2.5 text-center">
                    <Checkbox
                      checked={isEnabled(eventType, channel)}
                      onCheckedChange={() => toggle(eventType, channel)}
                      aria-label={`${EVENT_TYPE_LABELS[eventType]} via ${CHANNEL_LABELS[channel]}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button type="button" className="mt-4" onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving…' : 'Save preferences'}
      </Button>
    </div>
  );
}
