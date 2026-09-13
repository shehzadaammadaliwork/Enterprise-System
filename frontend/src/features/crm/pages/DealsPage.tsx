import { useState, type SubmitEvent } from 'react';
import { Link } from 'react-router-dom';
import { useCreateDeal, useCustomers, useDeals, useUpdateDeal } from '../api/hooks';
import { nextDealStages } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Modal } from '../../../shared/components/Modal';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import type { DealInput } from '../api/crm.api';
import type { DealStage } from '../api/types';

const STAGE_FILTERS: { label: string; value: DealStage | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'New', value: 'NEW' },
  { label: 'Qualified', value: 'QUALIFIED' },
  { label: 'Proposal', value: 'PROPOSAL' },
  { label: 'Negotiation', value: 'NEGOTIATION' },
  { label: 'Won', value: 'WON' },
  { label: 'Lost', value: 'LOST' },
];

const STAGES: DealStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const EMPTY_FORM: DealInput = { title: '', customerId: '', value: undefined, stage: 'NEW' };

function formatCurrency(value: number | null) {
  if (value === null) return '—';
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function DealsPage() {
  const [stage, setStage] = useState<DealStage | undefined>(undefined);
  const { data, isLoading } = useDeals(undefined, stage);
  const { data: customers } = useCustomers();
  const createMutation = useCreateDeal();
  const updateMutation = useUpdateDeal();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<DealInput>(EMPTY_FORM);
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
      onError: (error) => setErrorMessage(extractApiErrorMessage(error, 'Could not create deal.')),
    });
  }

  function handleStageChange(id: string, newStage: DealStage) {
    setStatusErrorMessage(null);
    updateMutation.mutate(
      { id, input: { stage: newStage } },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update deal stage.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Deals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track opportunities through the pipeline.</p>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {STAGE_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStage(filter.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              stage === filter.value
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{data?.meta.total ?? 0} deal(s)</p>
        {stage === 'NEW' && (
          <Button type="button" size="sm" onClick={openCreate}>
            Add deal
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
          No deals here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Expected close</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">{deal.title}</TableCell>
                  <TableCell className="text-muted-foreground">{deal.customer?.companyName ?? '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={deal.stage}
                      disabled={nextDealStages(deal.stage).length === 0 || updateMutation.isPending}
                      onValueChange={(value) => handleStageChange(deal.id, value as DealStage)}
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue>{deal.stage}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={deal.stage}>{deal.stage}</SelectItem>
                        {nextDealStages(deal.stage).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatCurrency(deal.value)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/crm/deals/${deal.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Add deal" onClose={() => setShowForm(false)}>
          {errorMessage && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="customerId">Customer</Label>
              <Select value={form.customerId} onValueChange={(value) => setForm({ ...form, customerId: value })}>
                <SelectTrigger id="customerId" className="w-full">
                  <SelectValue placeholder="Select a customer">
                    {customers?.data.find((c) => c.id === form.customerId)?.companyName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(customers?.data ?? []).map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="value">Value</Label>
                <Input
                  id="value"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.value ?? ''}
                  onChange={(e) => setForm({ ...form, value: e.target.value ? Number(e.target.value) : undefined })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="stage">Stage</Label>
                <Select
                  value={form.stage ?? 'NEW'}
                  onValueChange={(value) => setForm({ ...form, stage: value as DealStage })}
                >
                  <SelectTrigger id="stage" className="w-full">
                    <SelectValue>{form.stage ?? 'NEW'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="expectedCloseDate">Expected close date</Label>
              <Input
                id="expectedCloseDate"
                type="date"
                value={form.expectedCloseDate ?? ''}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending || !form.customerId}>
              {createMutation.isPending ? 'Creating…' : 'Create deal'}
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
}
