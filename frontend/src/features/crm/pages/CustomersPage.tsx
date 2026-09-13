import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCreateCustomer, useCustomers } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import type { CustomerInput } from '../api/crm.api';

const EMPTY_FORM: CustomerInput = { companyName: '', contactName: '', email: '', phone: '' };

export function CustomersPage() {
  const { data, isLoading } = useCustomers();
  const createMutation = useCreateCustomer();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CustomerInput>(EMPTY_FORM);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrorMessage(null);
    setShowForm(true);
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createMutation.mutate(form, {
      onSuccess: () => setShowForm(false),
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create customer.')),
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Accounts, deals, and logged meetings/calls in one place.</p>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} customer(s)</p>
        <Button type="button" size="sm" onClick={openCreate}>
          Add customer
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No customers yet.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.companyName}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.contactName}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.email ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone ?? '—'}</TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/crm/customers/${customer.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Add customer" onClose={() => setShowForm(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contactName">Contact name</Label>
              <Input
                id="contactName"
                required
                value={form.contactName}
                onChange={(e) => setForm({ ...form, contactName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email ?? ''}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone ?? ''}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={form.city ?? ''} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create customer'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
