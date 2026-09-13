import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useConvertLead, useLead, useUpdateLead } from '../api/hooks';
import { nextLeadStatuses } from '../lib/transitions';
import { extractApiErrorMessage } from '../../../shared/api/client';
import { NotesSection } from '../components/NotesSection';
import { Alert, AlertDescription } from '../../../components/ui/alert';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import type { LeadStatus } from '../api/types';

const STATUS_BADGE_VARIANT: Record<string, 'secondary' | 'outline' | 'destructive'> = {
  NEW: 'outline',
  CONTACTED: 'outline',
  QUALIFIED: 'outline',
  CONVERTED: 'secondary',
  LOST: 'destructive',
};

export function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lead, isLoading } = useLead(id);
  const convertMutation = useConvertLead();
  const updateMutation = useUpdateLead();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (isLoading || !lead) return <p className="text-sm text-muted-foreground">Loading…</p>;

  function handleConvert() {
    if (!id || !confirm(`Convert "${lead!.companyName}" to a customer?`)) return;
    setErrorMessage(null);
    convertMutation.mutate(id, {
      onSuccess: (result) => navigate(`/crm/customers/${result.customer.id}`),
      onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not convert lead.')),
    });
  }

  function handleStatusChange(status: LeadStatus) {
    if (!id) return;
    setErrorMessage(null);
    updateMutation.mutate(
      { id, input: { status } },
      { onError: (e) => setErrorMessage(extractApiErrorMessage(e, 'Could not update lead status.')) },
    );
  }

  // Next stage in the pipeline (or LOST) — see nextLeadStatuses. CONVERTED
  // is never in this list; it's only reachable via "Convert to customer"
  // below, and only once the lead is Qualified (Bug 1).
  const nextStatuses = nextLeadStatuses(lead.status);
  const nextIntermediateStatus = nextStatuses.find((status) => status !== 'LOST');
  const canMarkLost = nextStatuses.includes('LOST');
  const canConvert = lead.status === 'QUALIFIED';

  return (
    <div>
      <Link to="/crm/leads" className="mb-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
        <ArrowLeft className="size-3.5" />
        Back to leads
      </Link>

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{lead.companyName}</h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            {lead.contactName} · {lead.source}
            <Badge variant={STATUS_BADGE_VARIANT[lead.status]}>{lead.status}</Badge>
          </p>
        </div>
        <div className="flex items-end gap-2">
          {lead.status !== 'CONVERTED' && nextIntermediateStatus && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="status" className="text-xs text-muted-foreground">
                Status
              </Label>
              <Select value={lead.status} onValueChange={(value) => handleStatusChange(value as LeadStatus)}>
                <SelectTrigger id="status" className="w-36">
                  <SelectValue>{lead.status}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={lead.status}>{lead.status}</SelectItem>
                  <SelectItem value={nextIntermediateStatus}>{nextIntermediateStatus}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          {canMarkLost && (
            <Button
              variant="outline"
              className="text-destructive"
              onClick={() => handleStatusChange('LOST')}
              disabled={updateMutation.isPending}
            >
              Mark as Lost
            </Button>
          )}
          {lead.status === 'CONVERTED' ? (
            <Button variant="outline" asChild>
              <Link to={`/crm/customers/${lead.convertedToCustomerId}`}>View customer</Link>
            </Button>
          ) : (
            <span title={canConvert ? undefined : 'Move the lead to Qualified before converting it to a customer.'}>
              <Button onClick={handleConvert} disabled={!canConvert || convertMutation.isPending}>
                {convertMutation.isPending ? 'Converting…' : 'Convert to customer'}
              </Button>
            </span>
          )}
        </div>
      </div>

      {errorMessage && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="mb-8 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Email</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{lead.email ?? '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Phone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{lead.phone ?? '—'}</div>
          </CardContent>
        </Card>
      </div>

      <NotesSection target={{ leadId: lead.id }} />
    </div>
  );
}
