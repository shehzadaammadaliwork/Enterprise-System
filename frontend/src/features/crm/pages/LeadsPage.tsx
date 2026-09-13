import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCreateLead, useLeads, useUpdateLead } from '../api/hooks';
import { nextLeadStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import type { LeadInput } from '../api/crm.api';
import type { LeadSource, LeadStatus } from '../api/types';

const STATUS_FILTERS: { label: string; value: LeadStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'New', value: 'NEW' },
  { label: 'Contacted', value: 'CONTACTED' },
  { label: 'Qualified', value: 'QUALIFIED' },
  { label: 'Converted', value: 'CONVERTED' },
  { label: 'Lost', value: 'LOST' },
];

const SOURCES: LeadSource[] = ['WEBSITE', 'REFERRAL', 'COLD_CALL', 'EVENT', 'ADVERTISEMENT', 'OTHER'];

const EMPTY_FORM: LeadInput = { companyName: '', contactName: '', email: '', phone: '', source: 'OTHER' };

export function LeadsPage() {
  const [status, setStatus] = useState<LeadStatus | undefined>(undefined);
  const { data, isLoading } = useLeads(status);
  const createMutation = useCreateLead();
  const updateMutation = useUpdateLead();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<LeadInput>(EMPTY_FORM);
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
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create lead.')),
    });
  }

  function handleStatusChange(id: string, newStatus: LeadStatus) {
    setStatusErrorMessage(null);
    updateMutation.mutate(
      { id, input: { status: newStatus } },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update lead status.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Leads</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track prospects from first contact through conversion.</p>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              status === filter.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} lead(s)</p>
        {status === 'NEW' && (
          <Button type="button" size="sm" onClick={openCreate}>
            Add lead
          </Button>
        )}
      </div>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No leads here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.companyName}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.contactName}</TableCell>
                  <TableCell className="text-muted-foreground">{lead.source}</TableCell>
                  <TableCell>
                    <Select
                      value={lead.status}
                      disabled={nextLeadStatuses(lead.status).length === 0 || updateMutation.isPending}
                      onValueChange={(value) => handleStatusChange(lead.id, value as LeadStatus)}
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue>{lead.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={lead.status}>{lead.status}</SelectItem>
                        {nextLeadStatuses(lead.status).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/crm/leads/${lead.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Add lead" onClose={() => setShowForm(false)}>
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
              <Label htmlFor="source">Source</Label>
              <Select
                value={form.source ?? 'OTHER'}
                onValueChange={(value) => setForm({ ...form, source: value as LeadSource })}
              >
                <SelectTrigger id="source" className="w-full">
                  <SelectValue>{form.source ?? 'OTHER'}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating…' : 'Create lead'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
