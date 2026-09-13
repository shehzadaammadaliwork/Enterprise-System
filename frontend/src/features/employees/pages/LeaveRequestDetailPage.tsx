import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useDecideLeaveRequest, useLeaveRequest } from '../api/hooks';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';

const STATUS_BADGE_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'outline',
  APPROVED: 'secondary',
  REJECTED: 'destructive',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function LeaveRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: request, isLoading } = useLeaveRequest(id);
  const decideMutation = useDecideLeaveRequest();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !request) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleDecide(approve: boolean) {
    if (!id) return;
    setErrorMessage(null);
    decideMutation.mutate(
      { id, approve },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update request.')) },
    );
  }

  return (
    <div>
      <Link
        to="/leave-approvals"
        className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Back to leave approvals
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {request.employee?.user.firstName} {request.employee?.user.lastName}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {request.employee?.designation}
            <Badge variant={STATUS_BADGE_VARIANT[request.status]}>{request.status}</Badge>
          </p>
        </div>
        {request.status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <Button onClick={() => handleDecide(true)} disabled={decideMutation.isPending}>
              Approve
            </Button>
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => handleDecide(false)}
              disabled={decideMutation.isPending}
            >
              Reject
            </Button>
          </div>
        )}
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Leave type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{request.leaveType}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">From</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(request.startDate)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">To</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(request.endDate)}</div>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-2 text-lg font-semibold text-foreground">Reason</h2>
      <p className="text-sm text-muted-foreground">{request.reason ?? '—'}</p>
    </div>
  );
}
