import { useState, type SubmitEvent } from 'react';
import { useBroadcastAnnouncement } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';

interface BroadcastModalProps {
  onClose: () => void;
}

export function BroadcastModal({ onClose }: BroadcastModalProps) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const broadcastMutation = useBroadcastAnnouncement();

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    broadcastMutation.mutate(
      { title, message },
      {
        onSuccess: onClose,
        onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not send announcement.')),
      },
    );
  }

  return (
    <Modal title="Send announcement" onClose={onClose}>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Sent to every active user, subject to each person's own notification preferences.
        </p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="broadcast-title">Title</Label>
          <Input id="broadcast-title" required maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="broadcast-message">Message</Label>
          <Textarea
            id="broadcast-message"
            required
            maxLength={2000}
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={broadcastMutation.isPending}>
          {broadcastMutation.isPending ? 'Sending…' : 'Send announcement'}
        </Button>
      </form>
    </Modal>
  );
}
