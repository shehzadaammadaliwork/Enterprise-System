import { useState, type SubmitEvent } from 'react';
import { useCreateNote, useDeleteNote, useNotes } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Textarea } from '../../../components/ui/textarea';
import type { NoteTarget } from '../api/crm.api';

function formatDateTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/// Shared across LeadDetailPage/CustomerDetailPage/DealDetailPage — notes
/// attach to exactly one of lead/customer/deal (see NotesService on the
/// backend), so `target` is a discriminated union with exactly one key set.
export function NotesSection({ target }: { target: NoteTarget }) {
  const { data, isLoading } = useNotes(target);
  const createMutation = useCreateNote(target);
  const deleteMutation = useDeleteNote(target);
  const [body, setBody] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(body, {
      onSuccess: () => setBody(''),
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not save note.')),
    });
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this note?')) return;
    deleteMutation.mutate(id);
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-semibold text-foreground">Notes</h2>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Textarea
          placeholder="Add a note…"
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
        />
        <Button type="submit" size="sm" className="w-fit" disabled={createMutation.isPending}>
          {createMutation.isPending ? 'Saving…' : 'Add note'}
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-8 text-center text-sm text-muted-foreground">
          No notes yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {data.data.map((note) => (
            <li key={note.id} className="rounded-lg border bg-card p-3">
              <p className="text-sm whitespace-pre-wrap">{note.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatDateTime(note.createdAt)}</span>
                <Button
                  variant="link"
                  className="h-auto p-0 text-xs text-destructive"
                  onClick={() => handleDelete(note.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
