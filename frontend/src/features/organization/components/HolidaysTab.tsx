import { useState, type SubmitEvent } from 'react';
import { useCreateHoliday, useDeleteHoliday, useHolidays, useUpdateHoliday } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { CompanyHoliday } from '../api/types';
import type { HolidayInput } from '../api/organization.api';

const EMPTY_FORM: HolidayInput = { name: '', date: '', description: '', recurringAnnually: false };

export function HolidaysTab() {
  const { data, isLoading } = useHolidays();
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const deleteMutation = useDeleteHoliday();

  const [editing, setEditing] = useState<CompanyHoliday | 'new' | null>(null);
  const [form, setForm] = useState<HolidayInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setEditing('new');
  }

  function openEdit(holiday: CompanyHoliday) {
    setForm({
      name: holiday.name,
      date: holiday.date.slice(0, 10),
      description: holiday.description ?? '',
      recurringAnnually: holiday.recurringAnnually,
    });
    setErrorMessage(null);
    setEditing(holiday);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save holiday.'));
    const onSuccess = () => setEditing(null);

    if (editing === 'new') {
      createMutation.mutate(form, { onSuccess, onError });
    } else if (editing) {
      updateMutation.mutate({ id: editing.id, input: form }, { onSuccess, onError });
    }
  }

  function handleDelete(holiday: CompanyHoliday) {
    if (!confirm(`Delete holiday "${holiday.name}"?`)) return;
    deleteMutation.mutate(holiday.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} holiday(s)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add holiday
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No holidays configured yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((holiday) => (
                <TableRow key={holiday.id}>
                  <TableCell className="font-medium">{holiday.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(holiday.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {holiday.recurringAnnually ? 'Every year' : '—'}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-3">
                      <Button variant="link" className="h-auto p-0" onClick={() => openEdit(holiday)}>
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-destructive"
                        onClick={() => handleDelete(holiday)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <Modal title={editing === 'new' ? 'Add holiday' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holidayName">Name</Label>
              <Input
                id="holidayName"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holidayDate">Date</Label>
              <Input
                id="holidayDate"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="holidayDescription">Description</Label>
              <Input
                id="holidayDescription"
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={form.recurringAnnually ?? false}
                onCheckedChange={(checked) => setForm({ ...form, recurringAnnually: checked === true })}
              />
              Recurs every year
            </label>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving…' : 'Save'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
