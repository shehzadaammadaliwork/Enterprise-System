import { useState, type SubmitEvent } from 'react';
import { useBranches, useCreateBranch, useDeleteBranch, useUpdateBranch } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { Branch } from '../api/types';
import type { BranchInput } from '../api/organization.api';

const EMPTY_FORM: BranchInput = {
  name: '',
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  country: null,
  postalCode: null,
  phone: null,
  isHeadquarters: false,
};

export function BranchesTab() {
  const { data, isLoading } = useBranches();
  const createMutation = useCreateBranch();
  const updateMutation = useUpdateBranch();
  const deleteMutation = useDeleteBranch();

  const [editing, setEditing] = useState<Branch | 'new' | null>(null);
  const [form, setForm] = useState<BranchInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setEditing('new');
  }

  function openEdit(branch: Branch) {
    setForm({
      name: branch.name,
      addressLine1: branch.addressLine1,
      addressLine2: branch.addressLine2,
      city: branch.city,
      state: branch.state,
      country: branch.country,
      postalCode: branch.postalCode,
      phone: branch.phone,
      isHeadquarters: branch.isHeadquarters,
    });
    setErrorMessage(null);
    setEditing(branch);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save branch.'));
    const onSuccess = () => setEditing(null);

    if (editing === 'new') {
      createMutation.mutate(form, { onSuccess, onError });
    } else if (editing) {
      updateMutation.mutate({ id: editing.id, input: form }, { onSuccess, onError });
    }
  }

  function handleDelete(branch: Branch) {
    if (!confirm(`Delete branch "${branch.name}"? Departments assigned to it will become unassigned.`)) return;
    deleteMutation.mutate(branch.id);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} branch(es)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add branch
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No branches yet — add your first office location.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((branch) => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {branch.name}
                      {branch.isHeadquarters && <Badge variant="secondary">HQ</Badge>}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{branch.city ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{branch.country ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{branch.phone ?? '—'}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-3">
                      <Button variant="link" className="h-auto p-0" onClick={() => openEdit(branch)}>
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-destructive"
                        onClick={() => handleDelete(branch)}
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
        <Modal title={editing === 'new' ? 'Add branch' : `Edit ${editing.name}`} onClose={() => setEditing(null)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchName">Name</Label>
              <Input
                id="branchName"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="branchCity">City</Label>
                <Input
                  id="branchCity"
                  value={form.city ?? ''}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="branchCountry">Country</Label>
                <Input
                  id="branchCountry"
                  value={form.country ?? ''}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchAddress">Address</Label>
              <Input
                id="branchAddress"
                value={form.addressLine1 ?? ''}
                onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="branchPhone">Phone</Label>
              <Input
                id="branchPhone"
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-normal">
              <Checkbox
                checked={form.isHeadquarters ?? false}
                onCheckedChange={(checked) => setForm({ ...form, isHeadquarters: checked === true })}
              />
              This is the headquarters
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
