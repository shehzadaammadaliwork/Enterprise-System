import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAllLeaveRequests, useDecideLeaveRequest } from '../api/hooks';
import { nextLeaveStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { cn } from '../../../lib/utils';
import type { LeaveStatus } from '../api/types';

const FILTERS: { label: string; value: LeaveStatus | undefined }[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'All', value: undefined },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function LeaveApprovalsPage() {
  const [status, setStatus] = useState<LeaveStatus | undefined>('PENDING');
  const { data, isLoading } = useAllLeaveRequests(status);
  const decideMutation = useDecideLeaveRequest();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleStatusChange(id: string, newStatus: LeaveStatus) {
    setErrorMessage(null);
    decideMutation.mutate(
      { id, approve: newStatus === 'APPROVED' },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update request.')) },
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Leave approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review and decide on employee leave requests.</p>
      </div>

      <div className="mb-5 inline-flex items-center gap-0.5 rounded-lg bg-muted p-0.75">
        {FILTERS.map((filter) => (
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

      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !data?.data.length ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
          No leave requests here.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.data.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium">
                    {req.employee?.user.firstName} {req.employee?.user.lastName}
                  </TableCell>
                  <TableCell>{req.leaveType}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(req.startDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(req.endDate)}</TableCell>
                  <TableCell className="text-muted-foreground">{req.reason ?? '—'}</TableCell>
                  <TableCell>
                    <Select
                      value={req.status}
                      disabled={nextLeaveStatuses(req.status).length === 0 || decideMutation.isPending}
                      onValueChange={(value) => handleStatusChange(req.id, value as LeaveStatus)}
                    >
                      <SelectTrigger size="sm" className="w-32">
                        <SelectValue>{req.status}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={req.status}>{req.status}</SelectItem>
                        {nextLeaveStatuses(req.status).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button variant="link" className="h-auto p-0" asChild>
                      <Link to={`/leave-approvals/${req.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
