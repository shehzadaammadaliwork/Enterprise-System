import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuotes, useUpdateQuote } from '../api/hooks';
import { nextQuoteStatuses } from '../lib/transitions';
import { useCustomers } from '../../crm/api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import { formatMoney } from '../lib/format';
import type { QuoteStatus } from '../api/types';

const STATUS_FILTERS: { label: string; value: QuoteStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Accepted', value: 'ACCEPTED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Expired', value: 'EXPIRED' },
  { label: 'Converted', value: 'CONVERTED' },
];

/// Quotes are only ever created from a Deal's detail page (Deal in
/// Proposal/Negotiation stage), never from here — this page is view-only
/// for creation purposes, still fully usable for viewing, Draft editing,
/// Send/Accept/Reject, and Convert to order.
export function QuotesPage() {
  const [status, setStatus] = useState<QuoteStatus | undefined>(undefined);
  const { data, isLoading } = useQuotes(undefined, status);
  const { data: customers } = useCustomers();
  const updateMutation = useUpdateQuote();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  function handleStatusChange(id: string, newStatus: QuoteStatus) {
    setStatusErrorMessage(null);
    updateMutation.mutate(
      { id, input: { status: newStatus } },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update quote status.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Quotes</h1>
        <p className="mt-1 text-sm text-muted-foreground">Price out a deal for a customer, then convert it to an order.</p>
      </div>

      <div className="mb-5 inline-flex flex-wrap items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.label}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={cn(
              'rounded-md px-3 py-1 text-sm font-medium transition-colors',
              status === filter.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted-foreground">{data?.meta.total ?? 0} quote(s)</p>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No quotes here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Quote #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((quote) => {
                const customer = customers?.data.find((c) => c.id === quote.customerId);
                return (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">Q-{quote.number}</TableCell>
                    <TableCell className="text-muted-foreground">{customer?.companyName ?? '—'}</TableCell>
                    <TableCell>
                      <Select
                        value={quote.status}
                        disabled={nextQuoteStatuses(quote.status).length === 0 || updateMutation.isPending}
                        onValueChange={(value) => handleStatusChange(quote.id, value as QuoteStatus)}
                      >
                        <SelectTrigger size="sm" className="w-32">
                          <SelectValue>{quote.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={quote.status}>{quote.status}</SelectItem>
                          {nextQuoteStatuses(quote.status).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(quote.summary.total)}</TableCell>
                    <TableCell>
                      <Button variant="link" className="h-auto p-0" asChild>
                        <Link to={`/sales/quotes/${quote.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
