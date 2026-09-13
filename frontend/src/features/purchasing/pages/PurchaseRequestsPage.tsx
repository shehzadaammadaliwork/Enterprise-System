import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDecidePurchaseRequest, usePurchaseRequests } from '../api/hooks';
import { nextPurchaseRequestStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import type { PurchaseRequestStatus } from '../api/types';

const STATUS_FILTERS: { label: string; value: PurchaseRequestStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Purchased', value: 'PURCHASED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_BADGE_VARIANT: Record<PurchaseRequestStatus, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  PURCHASED: 'secondary',
  REJECTED: 'destructive',
};

function formatMoney(value: number) {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export function PurchaseRequestsPage() {
  const [status, setStatus] = useState<PurchaseRequestStatus | undefined>(undefined);
  const { data, isLoading } = usePurchaseRequests({ status });
  const decideMutation = useDecidePurchaseRequest();
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null);

  function handleDecide(id: string, target: PurchaseRequestStatus) {
    setStatusErrorMessage(null);
    decideMutation.mutate(
      { id, approve: target === 'APPROVED' },
      { onError: (e) => setStatusErrorMessage(extractApiErrorMessage(e, 'Could not update this request.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Purchase Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review, approve, and complete internal purchase requests.</p>
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

      <p className="mb-4 text-sm text-muted-foreground">{data?.meta.total ?? 0} request(s)</p>

      {statusErrorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{statusErrorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No purchase requests here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Estimated cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((request) => {
                const next = nextPurchaseRequestStatuses(request.status);
                return (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">
                      <Link to={`/purchase-requests/${request.id}`} className="text-primary hover:underline">
                        #{request.number}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{request.description}</TableCell>
                    <TableCell className="text-muted-foreground">{request.category}</TableCell>
                    <TableCell className="text-muted-foreground">{formatMoney(request.estimatedCost)}</TableCell>
                    <TableCell>
                      {next.length === 0 ? (
                        <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
                      ) : (
                        <Select
                          value={request.status}
                          disabled={decideMutation.isPending}
                          onValueChange={(value) => handleDecide(request.id, value as PurchaseRequestStatus)}
                        >
                          <SelectTrigger size="sm" className="w-36">
                            <SelectValue>{request.status}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={request.status}>{request.status}</SelectItem>
                            {next.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
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
