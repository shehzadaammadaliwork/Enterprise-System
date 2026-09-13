import { useState, type SubmitEvent } from 'react';
import { useBankAccounts, useCreateBankAccount, useDeleteBankAccount, useUpdateBankAccount } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { formatMoney } from '../lib/format';
import type { BankAccountInput } from '../api/finance.api';
import type { BankAccount } from '../api/types';

const EMPTY_FORM: BankAccountInput = { name: '', bankName: '', accountNumber: '', openingBalance: 0 };

export function BankAccountsPage() {
  const { data, isLoading } = useBankAccounts();
  const createMutation = useCreateBankAccount();
  const updateMutation = useUpdateBankAccount();
  const deleteMutation = useDeleteBankAccount();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<BankAccountInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  }

  function openEdit(account: BankAccount) {
    setEditing(account);
    setForm({
      name: account.name,
      bankName: account.bankName ?? '',
      accountNumber: account.accountNumber ?? '',
      openingBalance: account.openingBalance,
    });
    setErrorMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    const onSuccess = () => setShowForm(false);
    const onError = (error: unknown) => setErrorMessage(extractApiErrorMessage(error, 'Could not save account.'));
    if (editing) {
      const { name, bankName, accountNumber } = form;
      updateMutation.mutate({ id: editing.id, input: { name, bankName, accountNumber } }, { onSuccess, onError });
    } else {
      createMutation.mutate(form, { onSuccess, onError });
    }
  }

  function handleToggleActive(account: BankAccount) {
    updateMutation.mutate({ id: account.id, input: { isActive: !account.isActive } });
  }

  function handleDelete(account: BankAccount) {
    if (!confirm(`Delete "${account.name}"?`)) return;
    deleteMutation.mutate(account.id, {
      onError: (error) => alert(extractApiErrorMessage(error, 'Could not delete account.')),
    });
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Bank Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Balances update automatically as transactions are approved.</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} account(s)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add account
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No bank accounts yet.
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {data.data.map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{account.name}</CardTitle>
                  <Badge variant={account.isActive ? 'secondary' : 'outline'}>
                    {account.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{account.bankName || '—'}</p>
                <div className="mt-2 text-2xl font-bold">{formatMoney(account.balance)}</div>
                <div className="mt-4 flex items-center gap-3">
                  <Button variant="link" className="h-auto p-0" onClick={() => openEdit(account)}>
                    Edit
                  </Button>
                  <Button variant="link" className="h-auto p-0" onClick={() => handleToggleActive(account)}>
                    {account.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="link" className="h-auto p-0 text-destructive" onClick={() => handleDelete(account)}>
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editing ? 'Edit account' : 'Add account'} onClose={() => setShowForm(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Account name</Label>
              <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="bankName">Bank name</Label>
              <Input
                id="bankName"
                value={form.bankName ?? ''}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="accountNumber">Account number</Label>
              <Input
                id="accountNumber"
                value={form.accountNumber ?? ''}
                onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              />
            </div>
            {!editing && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="openingBalance">Opening balance</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  step="0.01"
                  value={form.openingBalance ?? 0}
                  onChange={(e) => setForm({ ...form, openingBalance: Number(e.target.value) })}
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving ? 'Saving…' : editing ? 'Save changes' : 'Create account'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
